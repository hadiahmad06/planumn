import type { CourseId } from "./course";
import { offeringHistory } from "./health";
import type { Plan } from "./plan";
import { compareTerms, nextTerm, previousTerm, seasonOf, type Season, type TermCode } from "./terms";

/**
 * ‹ › move arrows on planned courses (Hadi, 2026-10-27). Written by Hadi's Claude.
 *
 * Moving a course one step earlier or later snaps to the nearest term where it is historically offered:
 * a fall-only course goes Fall 2026 → Fall 2027, never to a spring. Terms in hidden seasons, leave-of-
 * absence semesters and terms that already hold the course are skipped. Moves stay within the plan's
 * first and last semester (add a year to go further). With too little offering history, every season
 * counts, and the caller says so.
 */
export interface SnapTarget {
  term: TermCode;
  /** False when the course's offering pattern is unknown, so any season was allowed. */
  offeringKnown: boolean;
}

export function snapMove(
  plan: Plan,
  from: TermCode,
  courseId: CourseId,
  direction: "earlier" | "later",
  termsOffered: string[] | undefined,
  hiddenSeasons: readonly Season[] = [],
): SnapTarget | null {
  // B18 (Ishaan's Claude): the AP / IB / transfer credit bucket is not a term to move courses into.
  if (plan.semesters.find((s) => s.index === from)?.kind === "prior") return null;
  const terms = plan.semesters.filter((s) => s.kind !== "prior").map((s) => s.index).sort(compareTerms);
  if (terms.length === 0) return null;
  const [first, last] = [terms[0], terms[terms.length - 1]];
  const offering = offeringHistory(termsOffered ?? []);
  const seasons: Season[] | null = offering.known ? offering.seasons : null;
  const step = direction === "later" ? nextTerm : previousTerm;

  for (let t = step(from); compareTerms(t, first) >= 0 && compareTerms(t, last) <= 0; t = step(t)) {
    const season = seasonOf(t);
    if (hiddenSeasons.includes(season)) continue;
    if (seasons && !seasons.includes(season)) continue;
    const semester = plan.semesters.find((s) => s.index === t);
    if (semester?.kind === "leave") continue;
    if (semester?.courses.some((c) => c.id === courseId)) continue;
    return { term: t, offeringKnown: seasons !== null };
  }
  return null;
}
