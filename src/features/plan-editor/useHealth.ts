"use client";

import { useMemo } from "react";
import { healthCheck, pacing, type HealthIssue, type Pacing } from "@/domain/health";
import type { Plan } from "@/domain/plan";
import { useCourseCache } from "@/features/catalog/courseCache";
import { usePrereqStatus } from "./prereqStatus";

export const issueKey = (term: string, courseId: number) => `${term}:${courseId}`;

/** Plan health (B4–B6): every issue, issues grouped per planned course, and credit pacing. */
export function useHealth(plan: Plan): { issues: HealthIssue[]; byCourse: Map<string, HealthIssue[]>; pace: Pacing } {
  const courses = useCourseCache((s) => s.courses);
  const summaries = useCourseCache((s) => s.summaries);
  const prereqs = usePrereqStatus(plan);
  return useMemo(() => {
    const issues = healthCheck({ plan, courses, prereqs });
    const byCourse = new Map<string, HealthIssue[]>();
    for (const i of issues) {
      if (i.term && i.courseId != null) {
        const k = issueKey(i.term, i.courseId);
        byCourse.set(k, [...(byCourse.get(k) ?? []), i]);
      }
    }
    const pace = pacing(plan, (id) => (courses[id] ?? summaries[id])?.credits.min ?? 0);
    return { issues, byCourse, pace };
  }, [plan, courses, summaries, prereqs]);
}
