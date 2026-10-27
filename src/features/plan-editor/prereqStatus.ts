"use client";

import { useMemo } from "react";
import { courseCode, equivalentCodes, type CourseDetails } from "@/domain/course";
import type { Plan } from "@/domain/plan";
import { checkPrereqs, parsePrereqs, type PrereqCheck } from "@/domain/prereqs";
import { useCourseCache } from "@/features/catalog/courseCache";

export const prereqKey = (term: string, courseId: number) => `${term}:${courseId}`;

/** Honors versions satisfy the regular course (shared with the elective badge, B11). */
const codesOf = (c: CourseDetails): string[] => equivalentCodes(courseCode(c));

/**
 * For every planned course with catalog prerequisites, whether they're planned in an earlier
 * semester (A29). Locked courses (already taken) are skipped.
 */
export function usePrereqStatus(plan: Plan): Map<string, PrereqCheck> {
  const courses = useCourseCache((s) => s.courses);
  return useMemo(() => {
    const out = new Map<string, PrereqCheck>();
    const before = new Set<string>();
    const semesters = [...plan.semesters].sort((a, b) => Number(a.index) - Number(b.index));
    for (const sem of semesters) {
      for (const pc of sem.courses) {
        const c = courses[pc.id];
        // B18: prior credit is already earned; it still counts as taken for later courses (below).
        if (!c?.prereqText || pc.lock === "locked" || sem.kind === "prior") continue;
        const node = parsePrereqs(c.prereqText, c.dept);
        if (node) out.set(prereqKey(sem.index, pc.id), checkPrereqs(node, (code) => before.has(code)));
      }
      for (const pc of sem.courses) {
        const c = courses[pc.id];
        if (c) codesOf(c).forEach((code) => before.add(code));
      }
    }
    return out;
  }, [plan, courses]);
}
