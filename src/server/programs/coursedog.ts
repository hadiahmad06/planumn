import "server-only";
import { cacheLife } from "next/cache";
import type { RawProgram } from "./normalize";

/**
 * UMN's public catalog API (CourseDog), the same source the 2025 app used. Unofficial: responses are
 * cached for a day and every caller must handle failure.
 */
const BASE = "https://app.coursedog.com/api/v1/cm/umn_umntc_peoplesoft";
const HEADERS = {
  Accept: "application/json",
  Origin: "https://umtc.catalog.prod.coursedog.com",
  Referer: "https://umtc.catalog.prod.coursedog.com/",
  "x-requested-with": "catalog",
};

export interface CourseDogCourse {
  courseGroupId: string;
  code: string;
  name: string;
  subjectCode: string;
  courseNumber: string;
  credits?: { creditHours?: { min?: number; max?: number } };
}

export async function fetchProgramVersions(programGroupId: string): Promise<Record<string, RawProgram>> {
  "use cache";
  cacheLife("days");
  const today = new Date().toISOString().slice(0, 10);
  const later = `${Number(today.slice(0, 4)) + 7}-12-31`;
  const url =
    `${BASE}/programs?programGroupIds=${encodeURIComponent(programGroupId)}` +
    `&effectiveDatesRange=${today}%2C${later}` +
    "&doNotDisplayAllMappedRevisionsAsDependencies=true&formatDependents=true&includeMappedDocumentItems=true";
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`CourseDog programs ${programGroupId}: ${res.status}`);
  return (await res.json()) as Record<string, RawProgram>;
}

/** Names and credits for courses that aren't in data/catalog.db (e.g. new since Fall 2024). */
export async function fetchCourseDogCourses(groupIds: string[]): Promise<CourseDogCourse[]> {
  "use cache";
  cacheLife("days");
  if (groupIds.length === 0) return [];
  const url =
    `${BASE}/courses/search/%24filters?courseGroupIds=${groupIds.map(encodeURIComponent).join(",")}` +
    `&limit=${groupIds.length + 20}&columns=code,name,courseGroupId,credits,subjectCode,courseNumber`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`CourseDog courses: ${res.status}`);
  const body = (await res.json()) as { data?: CourseDogCourse[] };
  return body.data ?? [];
}
