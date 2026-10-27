import "server-only";
import { cacheLife } from "next/cache";
import { libEdCodes } from "@/domain/libed";

/**
 * Course group ids per Twin Cities CLE code (B8 search filters). Written by Hadi's Claude.
 *
 * CourseDog can filter by an exact attribute string, but one designation has several spellings
 * ("CLE - DSJ (Race, Power, and Justice US)" and "CLE - DSJ (Diversity and Soc Justice US)"), and a
 * course's older versions can carry a designation its current version dropped. So this reads every
 * course's attributes once (three pages, cached for days) and keeps the version in effect today, the
 * same rule `fetchLibEdCodes` uses.
 */
const BASE = "https://app.coursedog.com/api/v1/cm/umn_umntc_peoplesoft";
const TIMEOUT_MS = 20_000;
const HEADERS = {
  Accept: "application/json",
  Origin: "https://umtc.catalog.prod.coursedog.com",
  Referer: "https://umtc.catalog.prod.coursedog.com/",
  "x-requested-with": "catalog",
};
const PAGE = 10_000;
const MAX_PAGES = 6;

interface Row {
  courseGroupId?: string;
  attributes?: unknown;
  effectiveStartDate?: string;
}

async function page(skip: number): Promise<{ total: number; rows: Row[] }> {
  const url = `${BASE}/courses/search/%24filters?limit=${PAGE}&skip=${skip}&columns=courseGroupId,attributes,effectiveStartDate`;
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`CourseDog courses: ${res.status}`);
  const body = (await res.json()) as { listLength?: number; data?: Row[] };
  return { total: body.listLength ?? 0, rows: body.data ?? [] };
}

/** Newest version in effect today wins; a course with only future versions uses the earliest. */
export function currentVersions(rows: Row[], today: string): Map<string, Row> {
  const best = new Map<string, Row>();
  for (const row of rows) {
    const id = row.courseGroupId;
    if (!id) continue;
    const start = row.effectiveStartDate ?? "";
    const current = best.get(id);
    const currentStart = current?.effectiveStartDate ?? "";
    const better =
      !current ||
      (start <= today && (currentStart > today || start > currentStart)) ||
      (start > today && currentStart > today && start < currentStart);
    if (better) best.set(id, row);
  }
  return best;
}

export async function fetchLibEdIndex(): Promise<Record<string, string[]>> {
  "use cache";
  cacheLife("days");
  const first = await page(0);
  const rest = await Promise.all(
    Array.from({ length: Math.min(Math.ceil(first.total / PAGE), MAX_PAGES) - 1 }, (_, i) => page((i + 1) * PAGE)),
  );
  const best = currentVersions([first, ...rest].flatMap((p) => p.rows), new Date().toISOString().slice(0, 10));
  const index: Record<string, string[]> = {};
  for (const [id, row] of best) for (const code of libEdCodes(row.attributes)) (index[code] ??= []).push(id);
  return index;
}
