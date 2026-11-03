"use client";

import { courseCode, type CourseId } from "@/domain/course";
import { programCourseCodes, programCourseIds, programListsCourse, type Program } from "@/domain/requirements";
import { useCourseInfo } from "@/features/catalog/courseCache";
import { useProgramStore } from "./programStore";

const listed = new WeakMap<Program, { ids: Set<CourseId>; codes: Set<string> }>();

function listedBy(program: Program) {
  let l = listed.get(program);
  if (!l) listed.set(program, (l = { ids: programCourseIds(program), codes: programCourseCodes(program) }));
  return l;
}

/**
 * B11: true when the course counts toward none of the given programs' requirements. False while any
 * program is loading or failed, and when the plan has no programs (nothing to be an elective of).
 * Honors versions count when the program lists the regular course ("CSCI 1933H" for "CSCI 1933").
 * Doesn't load programs itself; the requirements rail does.
 */
export function useIsElective(courseId: CourseId, programIds: readonly string[]): boolean {
  const entries = useProgramStore((s) => s.entries);
  const course = useCourseInfo(courseId);
  if (programIds.length === 0) return false;
  const code = course ? courseCode(course) : null;
  for (const id of programIds) {
    const e = entries[id];
    if (e?.status !== "ready") return false;
    const { ids, codes } = listedBy(e.program);
    if (programListsCourse(ids, codes, courseId, code)) return false;
  }
  return true;
}
