"use client";

import { useMemo } from "react";
import type { Plan } from "@/domain/plan";
import { evaluateProgram, type PlannedForAudit, type ProgramResult } from "@/domain/requirements";
import { useCourseCache } from "@/features/catalog/courseCache";
import { usePrograms } from "./programStore";

/** Evaluate the plan against every program it targets. Programs still loading are skipped. */
export function useAudit(plan: Plan | null): { results: ProgramResult[]; met: number; total: number } {
  const entries = usePrograms(plan?.programs ?? []);
  const courses = useCourseCache((s) => s.courses);
  const summaries = useCourseCache((s) => s.summaries);

  return useMemo(() => {
    if (!plan) return { results: [], met: 0, total: 0 };
    const seen = new Set<number>();
    const planned: PlannedForAudit[] = [];
    for (const sem of plan.semesters)
      for (const c of sem.courses) {
        if (seen.has(c.id)) continue;
        seen.add(c.id);
        planned.push({ courseId: c.id, credits: (courses[c.id] ?? summaries[c.id])?.credits.min ?? 0 });
      }
    const results = plan.programs.flatMap((id) => {
      const e = entries[id];
      return e?.status === "ready" ? [evaluateProgram(e.program, planned)] : [];
    });
    return { results, met: results.reduce((n, r) => n + r.filled, 0), total: results.reduce((n, r) => n + r.units, 0) };
  }, [plan, entries, courses, summaries]);
}
