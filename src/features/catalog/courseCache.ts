"use client";

import { useEffect } from "react";
import { create } from "zustand";
import type { CourseDetails, CourseId, CourseSummary, CreditRange } from "@/domain/course";

/**
 * Client-side course details cache, shared by every feature (schedule cards, preview, requirements).
 * Batch-fetches from GET /api/courses and never refetches an id it already has.
 */
interface CourseCacheState {
  courses: Record<CourseId, CourseDetails>;
  missing: Record<CourseId, true>;
  /** Search results seen so far, so a just-dropped course renders before its details arrive. */
  summaries: Record<CourseId, CourseSummary>;
  /** Merge already-fetched details (e.g. from a server component). */
  put: (courses: CourseDetails[]) => void;
  putSummaries: (courses: CourseSummary[]) => void;
}

export const useCourseCache = create<CourseCacheState>()((set) => ({
  courses: {},
  missing: {},
  summaries: {},
  put: (courses) =>
    set((s) => ({ courses: { ...s.courses, ...Object.fromEntries(courses.map((c) => [c.id, c])) } })),
  putSummaries: (courses) =>
    set((s) => ({ summaries: { ...s.summaries, ...Object.fromEntries(courses.map((c) => [c.id, c])) } })),
}));

/** Credits of a set of courses from whatever is cached (unknown courses count as 0). */
export function useCreditTotal(ids: CourseId[]): CreditRange {
  const courses = useCourseCache((s) => s.courses);
  const summaries = useCourseCache((s) => s.summaries);
  let min = 0;
  let max = 0;
  for (const id of ids) {
    const c = (courses[id] ?? summaries[id])?.credits;
    min += c?.min ?? 0;
    max += c?.max ?? 0;
  }
  return { min, max };
}

/** Best info available for a course right now: full details, else a search summary. */
export function useCourseInfo(id: CourseId): CourseSummary | undefined {
  return useCourseCache((s) => s.courses[id] ?? s.summaries[id]);
}

const inFlight = new Set<CourseId>();
const BATCH = 200;

export async function fetchCourses(ids: CourseId[]): Promise<void> {
  const { courses, missing } = useCourseCache.getState();
  const todo = [...new Set(ids)].filter((id) => !courses[id] && !missing[id] && !inFlight.has(id));
  if (todo.length === 0) return;
  todo.forEach((id) => inFlight.add(id));
  try {
    for (let i = 0; i < todo.length; i += BATCH) {
      const chunk = todo.slice(i, i + BATCH);
      const res = await fetch(`/api/courses?ids=${chunk.join(",")}`);
      if (!res.ok) throw new Error(`GET /api/courses failed: ${res.status}`);
      const found = (await res.json()) as CourseDetails[];
      const foundIds = new Set(found.map((c) => c.id));
      useCourseCache.setState((s) => ({
        courses: { ...s.courses, ...Object.fromEntries(found.map((c) => [c.id, c])) },
        missing: { ...s.missing, ...Object.fromEntries(chunk.filter((id) => !foundIds.has(id)).map((id) => [id, true])) },
      }));
    }
  } finally {
    todo.forEach((id) => inFlight.delete(id));
  }
}

/** Details for one course; undefined while loading (or if the id doesn't exist). */
export function useCourse(id: CourseId | null | undefined): CourseDetails | undefined {
  const course = useCourseCache((s) => (id == null ? undefined : s.courses[id]));
  useEffect(() => {
    if (id != null) void fetchCourses([id]);
  }, [id]);
  return course;
}

/** Ensures every id is fetched; returns the cache map. */
export function useCourses(ids: CourseId[]): Record<CourseId, CourseDetails> {
  const key = ids.join(",");
  useEffect(() => {
    if (key) void fetchCourses(key.split(",").map(Number));
  }, [key]);
  return useCourseCache((s) => s.courses);
}
