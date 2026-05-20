import { RequirementProgress } from "./requirementEvaluator";

export interface GlobalProgress {
  met: number;
  total: number;
}

/**
 * Course-deduped progress aggregate per ADR-0002.
 *
 * - `completeCourses(n)` rules contribute `n` slots; each filled slot is
 *   keyed to a specific course.
 * - `minimumCourses(n)` rules contribute `n` slots; each filled slot is
 *   keyed to a specific course (capped at `n`).
 * - `minimumCredits` rules contribute 1 binary slot — not course-keyed.
 *
 * Met = (distinct courses contributing across all cc/mc rules) +
 *       (count of credit rules whose floor is met).
 */
export function calculateGlobalProgress(
  requirements: RequirementProgress[]
): GlobalProgress {
  let total = 0;
  let creditRulesFilled = 0;
  const contributors = new Set<number>();

  for (const req of requirements) {
    for (const rp of req.ruleProgress) {
      total += rp.slots;

      if (rp.rule.condition === "minimumCredits") {
        if (rp.slotsFilled > 0) creditRulesFilled += 1;
        continue;
      }

      for (const sat of rp.satisfactions) {
        contributors.add(sat.courseId);
      }
    }
  }

  return { met: contributors.size + creditRulesFilled, total };
}
