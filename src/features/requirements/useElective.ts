"use client";

import type { CourseId } from "@/domain/course";
import { programCourseIds, type Program } from "@/domain/requirements";
import { useProgramStore } from "./programStore";

const listed = new WeakMap<Program, Set<CourseId>>();

function courseIdsOf(program: Program): Set<CourseId> {
  let ids = listed.get(program);
  if (!ids) listed.set(program, (ids = programCourseIds(program)));
  return ids;
}

/**
 * B11: true when the course counts toward none of the given programs' requirements. False while any
 * program is loading or failed, and when the plan has no programs (nothing to be an elective of).
 * Doesn't load programs itself; the requirements rail does.
 */
export function useIsElective(courseId: CourseId, programIds: readonly string[]): boolean {
  const entries = useProgramStore((s) => s.entries);
  if (programIds.length === 0) return false;
  for (const id of programIds) {
    const e = entries[id];
    if (e?.status !== "ready" || courseIdsOf(e.program).has(courseId)) return false;
  }
  return true;
}
