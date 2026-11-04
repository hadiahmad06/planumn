"use client";

import { useMemo } from "react";
import { courseCode } from "@/domain/course";
import type { Plan } from "@/domain/plan";
import { evaluateProgram, type PlannedForAudit, type ProgramResult } from "@/domain/requirements";
import { useCourseCache } from "@/features/catalog/courseCache";
import { usePrograms } from "./programStore";

/**
 * Evaluate the plan against every program it targets. Programs still loading are skipped. `planned` is
 * the list evaluated (each course once), for C4's APAS comparison.
 */
export function useAudit(plan: Plan | null): { results: ProgramResult[]; met: number; total: number; planned: PlannedForAudit[] } {
  const entries = usePrograms(plan?.programs ?? []);
  const courses = useCourseCache((s) => s.courses);
  const summaries = useCourseCache((s) => s.summaries);

  return useMemo(() => {
    if (!plan) return { results: [], met: 0, total: 0, planned: [] };
    const seen = new Set<number>();
    const planned: PlannedForAudit[] = [];
    for (const sem of plan.semesters)
      for (const c of sem.courses) {
        if (seen.has(c.id)) continue;
        seen.add(c.id);
        const known = courses[c.id] ?? summaries[c.id];
        // The code lets C3's catalog-text patterns ("EE 4xxx") match the course; that counts toward progress,
        // tentatively, only for APAS-checked programs (Hadi, 2026-11-04).
        planned.push({ courseId: c.id, credits: known?.credits.min ?? 0, code: known ? courseCode(known) : null });
      }
    const results = plan.programs.flatMap((id) => {
      const e = entries[id];
      return e?.status === "ready" ? [evaluateProgram(e.program, planned)] : [];
    });
    return { results, met: results.reduce((n, r) => n + r.filled, 0), total: results.reduce((n, r) => n + r.units, 0), planned };
  }, [plan, entries, courses, summaries]);
}
