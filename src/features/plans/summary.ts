import type { CourseSummary } from "@/domain/course";
import { placeholderCredits, type Plan } from "@/domain/plan";

/** Written by Michael's Codex. Scheduled entries (including retakes), not earned degree credits. */
export function planListSummary(
  plan: Plan,
  courses: Record<number, CourseSummary | undefined>,
) {
  let courseEntries = 0;
  let placeholderSlots = 0;
  let minimumCredits = 0;
  let creditsReady = true;
  for (const semester of plan.semesters) {
    placeholderSlots += semester.placeholders?.length ?? 0;
    minimumCredits += placeholderCredits(semester);
    for (const entry of semester.courses) {
      courseEntries++;
      const course = courses[entry.id];
      if (course) minimumCredits += course.credits.min;
      else creditsReady = false;
    }
  }
  return { courseEntries, placeholderSlots, minimumCredits, creditsReady };
}
