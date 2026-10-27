"use client";

import { useMemo } from "react";
import { courseCode, type CourseDetails } from "@/domain/course";
import type { Plan } from "@/domain/plan";
import { checkPrereqs, parsePrereqs, type PrereqCheck } from "@/domain/prereqs";
import { useCourseCache } from "@/features/catalog/courseCache";

export const prereqKey = (term: string, courseId: number) => `${term}:${courseId}`;

/** Honors versions satisfy the regular course: "CSCI 1933H" counts as "CSCI 1933". */
function codesOf(c: CourseDetails): string[] {
  const code = courseCode(c);
  return /\dH$/.test(code) ? [code, code.slice(0, -1)] : [code];
}

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
        if (!c?.prereqText || pc.lock === "locked") continue;
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
