import "server-only";
import { createHash } from "node:crypto";
import { cacheLife } from "next/cache";
import { catalog, CAMPUS } from "@/server/catalog/db";
import { fetchProgramVersions } from "@/server/programs/coursedog";
import { pickCurrentVersion } from "@/server/programs/normalize";
import type {
  CatalogCheck,
  CatalogItem,
} from "@/features/catalog-changes/history";

interface CourseRow {
  courseGroupId: string;
  deprecatedCourseGroupId?: string;
  subjectCode?: string;
  courseNumber?: string;
  name?: string;
  effectiveStartDate?: string;
  credits?: { creditHours?: { min?: number; max?: number } };
}
export function stableCatalogValue(value: unknown): string {
  if (Array.isArray(value))
    return `[${value.map(stableCatalogValue).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, v]) => `${JSON.stringify(key)}:${stableCatalogValue(v)}`)
      .join(",")}}`;
  return JSON.stringify(value) ?? "null";
}
export const catalogFingerprint = (value: unknown) =>
  createHash("sha256").update(stableCatalogValue(value)).digest("hex");
const clean = (value: string) => value.replace(/\s+/g, " ").trim();
/** Match the public catalog version policy: newest started version, otherwise earliest future version. */
export function chooseCourseVersion(
  rows: CourseRow[],
  today: string,
): CourseRow | undefined {
  const started = rows.filter((row) => (row.effectiveStartDate ?? "") <= today);
  return [...(started.length ? started : rows)].sort((a, b) => {
    const date = (a.effectiveStartDate ?? "").localeCompare(
      b.effectiveStartDate ?? "",
    );
    return (
      (started.length ? -date : date) ||
      stableCatalogValue(a).localeCompare(stableCatalogValue(b))
    );
  })[0];
}
async function publicCourses(ids: string[]): Promise<CourseRow[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 3600, expire: 86400 });
  if (!ids.length) return [];
  const url =
    "https://app.coursedog.com/api/v1/cm/umn_umntc_peoplesoft/courses/search/%24filters?courseGroupIds=" +
    ids.map(encodeURIComponent).join(",") +
    `&limit=${ids.length * 3 + 20}&columns=courseGroupId,deprecatedCourseGroupId,name,subjectCode,courseNumber,credits,effectiveStartDate`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      Origin: "https://umtc.catalog.prod.coursedog.com",
      Referer: "https://umtc.catalog.prod.coursedog.com/",
      "x-requested-with": "catalog",
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error("Course catalog unavailable");
  const body = (await res.json()) as { data?: CourseRow[] };
  if (!Array.isArray(body.data)) throw new Error("Course catalog unavailable");
  return body.data;
}
/** Written by Michael's Codex. One bounded public-catalog request batch; no personalized records. */
export async function catalogCheck(
  courseIds: number[],
  programIds: string[],
  now = new Date(),
): Promise<CatalogCheck> {
  const items: CatalogItem[] = [],
    unavailable: string[] = [];
  const today = now.toISOString().slice(0, 10);
  const rows = courseIds.length
    ? (catalog()
        .prepare(
          `SELECT id,courseGroupId,dept_abbr,course_num FROM classdistribution WHERE campus=? AND id IN (${courseIds.map(() => "?").join(",")})`,
        )
        .all(CAMPUS, ...courseIds) as unknown as {
        id: number;
        courseGroupId: string | null;
        dept_abbr: string;
        course_num: string;
      }[])
    : [];
  const groups = [
    ...new Set(
      rows.flatMap((row) => (row.courseGroupId ? [row.courseGroupId] : [])),
    ),
  ];
  let observed: CourseRow[] = [];
  try {
    observed = await publicCourses(groups);
  } catch {
    /* Failures remain unavailable, not removals. */
  }
  for (const id of courseIds) {
    const base = rows.find((row) => row.id === id);
    const label = base
      ? `${base.dept_abbr} ${base.course_num}`
      : `Course ${id}`;
    const row = base?.courseGroupId
      ? chooseCourseVersion(
          observed.filter(
            (row) =>
              row.courseGroupId === base.courseGroupId ||
              row.deprecatedCourseGroupId === base.courseGroupId,
          ),
          today,
        )
      : undefined;
    if (!row || typeof row.name !== "string" || !row.name.trim()) {
      unavailable.push(label);
      continue;
    }
    const name = clean(row.name),
      code = clean(
        `${row.subjectCode ?? base!.dept_abbr} ${row.courseNumber ?? base!.course_num}`,
      );
    const hours = row.credits?.creditHours;
    const min = Number.isFinite(hours?.min) ? hours!.min! : null,
      max = Number.isFinite(hours?.max) ? hours!.max! : min;
    const start = row.effectiveStartDate ?? null;
    items.push({
      key: `course:${id}`,
      label,
      summary:
        `${code} · ${name}${min === null ? " · credits unavailable" : ` · ${min === max ? min : `${min}–${max}`} cr`}${start ? ` · version starts ${start}` : ""}`.slice(
          0,
          1000,
        ),
      fingerprint: catalogFingerprint({ code, name, min, max, start }),
    });
  }
  // Sequential program reads, bounded by the route. Existing public-source caches are reused.
  for (const id of programIds) {
    try {
      const raw = pickCurrentVersion(await fetchProgramVersions(id));
      if (!raw) {
        unavailable.push(`Program ${id}`);
        continue;
      }
      const label = clean(raw.name || `Program ${id}`).slice(0, 300),
        start = raw.effectiveStartDate ?? null;
      items.push({
        key: `program:${id}`,
        label,
        summary: `${label}${start ? ` · version starts ${start}` : ""}`,
        fingerprint: catalogFingerprint({
          name: raw.name,
          start,
          requisites: raw.requisites,
          requirementLevels: raw.requirementLevels,
        }),
      });
    } catch {
      unavailable.push(`Program ${id}`);
    }
  }
  return { items, unavailable, checkedAt: now.toISOString() };
}
