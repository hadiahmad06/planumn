import "server-only";
import { cacheLife } from "next/cache";
import { libEdCodes } from "@/domain/libed";

/**
 * Twin Cities Lib Ed designations from the UMN catalog (CourseDog), B3. Written by Ishaan's Claude.
 * The bundled catalog's tags are unreliable for this (other campuses' and wrong designations), so the
 * designations come from the same public CourseDog API the program requirements already use.
 */
const BASE = "https://app.coursedog.com/api/v1/cm/umn_umntc_peoplesoft";
const TIMEOUT_MS = 10_000;
const HEADERS = {
  Accept: "application/json",
  Origin: "https://umtc.catalog.prod.coursedog.com",
  Referer: "https://umtc.catalog.prod.coursedog.com/",
  "x-requested-with": "catalog",
};
const CHUNK = 100;

interface Row {
  courseGroupId?: string;
  attributes?: unknown;
  effectiveStartDate?: string;
}

/**
 * CLE codes per CourseDog course group id. Group ids CourseDog doesn't return are absent from the
 * result. When several versions come back, the newest one that has started wins.
 */
export async function fetchLibEdCodes(groupIds: string[]): Promise<Record<string, string[]>> {
  "use cache";
  cacheLife("days");
  const today = new Date().toISOString().slice(0, 10);
  const best = new Map<string, Row>();
  for (let i = 0; i < groupIds.length; i += CHUNK) {
    const chunk = groupIds.slice(i, i + CHUNK);
    const url =
      `${BASE}/courses/search/%24filters?courseGroupIds=${chunk.map(encodeURIComponent).join(",")}` +
      `&limit=${chunk.length * 3 + 20}&columns=courseGroupId,attributes,effectiveStartDate`;
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`CourseDog courses: ${res.status}`);
    const body = (await res.json()) as { data?: Row[] };
    for (const row of body.data ?? []) {
      const id = row.courseGroupId;
      if (!id || !chunk.includes(id)) continue;
      const start = row.effectiveStartDate ?? "";
      const current = best.get(id);
      const currentStart = current?.effectiveStartDate ?? "";
      // Prefer versions in effect today; among those, the newest.
      const better =
        !current ||
        (start <= today && (currentStart > today || start > currentStart)) ||
        (start > today && currentStart > today && start < currentStart);
      if (better) best.set(id, row);
    }
  }
  return Object.fromEntries([...best].map(([id, row]) => [id, libEdCodes(row.attributes)]));
}
