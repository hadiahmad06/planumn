import "server-only";
import { cacheLife } from "next/cache";
import type { Program } from "@/domain/requirements";
import { findCoursesByGroupIds } from "@/server/catalog/courses";
import { collectGroupIds, normalizeProgram, pickCurrentVersion, type RawProgram } from "@/server/programs/normalize";

/**
 * Every undergraduate minor's requirements, normalized like `getProgram` (B14). Written by Ishaan's Claude.
 * CourseDog takes many program group ids per request, so ~300 minors load in about a dozen requests,
 * cached for days. Course names for not-in-catalog options are skipped: the finder only needs ids.
 */
const BASE = "https://app.coursedog.com/api/v1/cm/umn_umntc_peoplesoft";
const TIMEOUT_MS = 20_000;
const HEADERS = {
  Accept: "application/json",
  Origin: "https://umtc.catalog.prod.coursedog.com",
  Referer: "https://umtc.catalog.prod.coursedog.com/",
  "x-requested-with": "catalog",
};
const BATCH = 25;
const PARALLEL = 3;

async function fetchBatch(ids: string[], today: string): Promise<RawProgram[]> {
  const later = `${Number(today.slice(0, 4)) + 7}-12-31`;
  const url =
    `${BASE}/programs?programGroupIds=${ids.map(encodeURIComponent).join(",")}` +
    `&effectiveDatesRange=${today}%2C${later}` +
    "&doNotDisplayAllMappedRevisionsAsDependencies=true&formatDependents=true&includeMappedDocumentItems=true";
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`CourseDog programs: ${res.status}`);
  const body = (await res.json()) as Record<string, RawProgram>;
  // One entry per program version; keep the version in effect today for each program.
  const byGroup = new Map<string, Record<string, RawProgram>>();
  for (const [key, version] of Object.entries(body)) {
    const g = version.programGroupId;
    if (!g || !ids.includes(g)) continue;
    byGroup.set(g, { ...(byGroup.get(g) ?? {}), [key]: version });
  }
  return [...byGroup.values()].flatMap((versions) => {
    const current = pickCurrentVersion(versions);
    return current ? [current] : [];
  });
}

export async function fetchMinorPrograms(minorIds: string[]): Promise<Program[]> {
  "use cache";
  cacheLife("days");
  const today = new Date().toISOString().slice(0, 10);
  const batches: string[][] = [];
  for (let i = 0; i < minorIds.length; i += BATCH) batches.push(minorIds.slice(i, i + BATCH));
  const raws: RawProgram[] = [];
  for (let i = 0; i < batches.length; i += PARALLEL)
    for (const r of await Promise.all(batches.slice(i, i + PARALLEL).map((b) => fetchBatch(b, today)))) raws.push(...r);

  const inCatalog = findCoursesByGroupIds([...new Set(raws.flatMap(collectGroupIds))]);
  return raws.map((raw) =>
    normalizeProgram(raw, (groupId) => {
      const c = inCatalog.get(groupId);
      return c
        ? { groupId, courseId: c.id, code: `${c.dept} ${c.number}`, title: c.title, credits: c.credits }
        : { groupId, courseId: null, code: null, title: null, credits: null };
    }),
  );
}
