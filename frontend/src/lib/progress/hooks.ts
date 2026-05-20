"use client";

import { useContext, useMemo } from "react";
import { PlanContext } from "@/contexts/data/PlanContext";
import { PlanAuditContext } from "@/contexts/data/PlanAuditContext";
import { PlannedCourse } from "@/types/plan";
import {
  evaluateRequirements,
  RequirementProgress,
} from "./requirementEvaluator";
import {
  calculateGlobalProgress,
  GlobalProgress,
} from "./globalProgressCalculator";

/** Hydrate the plan's semester courses into PlannedCourse[] using PlanContext caches. */
export function useHydratedPlannedCourses(): PlannedCourse[] {
  const { plan, cachedCourses } = useContext(PlanContext);
  const { cachedReqCourses } = useContext(PlanAuditContext);

  return useMemo(() => {
    if (!plan) return [];
    const out: PlannedCourse[] = [];
    for (const sem of plan.semesters) {
      for (const course of sem.courses) {
        const cached =
          cachedCourses[course.id] ||
          cachedReqCourses[String(course.id)];
        if (cached) {
          out.push({ ...cached, lock: course.lock });
        }
      }
    }
    return out;
  }, [plan, cachedCourses, cachedReqCourses]);
}

export function useEvaluatedRequirements(): RequirementProgress[] {
  const { reqGroups } = useContext(PlanAuditContext);
  const planned = useHydratedPlannedCourses();

  return useMemo(() => {
    const groups = reqGroups?.["requisitesSimple"] ?? [];
    return evaluateRequirements(groups, planned);
  }, [reqGroups, planned]);
}

export function useGlobalProgress(): GlobalProgress {
  const reqs = useEvaluatedRequirements();
  return useMemo(() => calculateGlobalProgress(reqs), [reqs]);
}
