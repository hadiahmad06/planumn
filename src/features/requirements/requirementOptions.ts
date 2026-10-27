"use client";

import type { CourseId } from "@/domain/course";
import type { Plan } from "@/domain/plan";
import { listedCourseIds } from "@/domain/requirements";
import { useAudit } from "./useAudit";

/** A requirement the search can filter by ("satisfies requirement X", B8). */
export interface RequirementOption {
  /** `${programId}/${requirementId}`, unique across the plan's programs. */
  key: string;
  programName: string;
  name: string;
  satisfied: boolean;
  /** Catalog courses the requirement lists. */
  courseIds: CourseId[];
}

/** The plan's program requirements that list at least one catalog course, in rail order. */
export function useRequirementOptions(plan: Plan | null): RequirementOption[] {
  const { results } = useAudit(plan);
  return results.flatMap((p) =>
    p.requirements.flatMap((r) => {
      const courseIds = [...new Set(r.requirement.rules.flatMap(listedCourseIds))];
      if (courseIds.length === 0) return [];
      return [{ key: `${p.program.id}/${r.requirement.id}`, programName: p.program.name, name: r.requirement.name, satisfied: r.satisfied, courseIds }];
    }),
  );
}
