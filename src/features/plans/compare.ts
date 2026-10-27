import {
  normalizeSemesters,
  type Plan,
  type PlannedCourse,
} from "@/domain/plan";

export type CourseDifference =
  "same" | "lock-changed" | "different-term" | "only-here";
export interface ComparedCourse {
  course: PlannedCourse;
  difference: CourseDifference;
}
export interface ComparedTerm {
  index: string;
  leftPresent: boolean;
  rightPresent: boolean;
  left: ComparedCourse[];
  right: ComparedCourse[];
}
/** Written by Michael's Codex. Pair equal locks first, then remaining retakes, without mutating either plan. */
export function comparePlans(left: Plan, right: Plan): ComparedTerm[] {
  const leftTerms = new Map(
    normalizeSemesters(left.semesters).map((term) => [
      term.index,
      term.courses,
    ]),
  );
  const rightTerms = new Map(
    normalizeSemesters(right.semesters).map((term) => [
      term.index,
      term.courses,
    ]),
  );
  const indices = [
    ...new Set([...leftTerms.keys(), ...rightTerms.keys()]),
  ].sort((a, b) => Number(a) - Number(b));
  return indices.map((index) => {
    const a = leftTerms.get(index) ?? [],
      b = rightTerms.get(index) ?? [];
    const used = new Set<number>();
    const matches = new Map<number, number>();
    // A later exact match must not be consumed by an earlier differing lock.
    for (const exact of [true, false])
      a.forEach((course, ai) => {
        if (matches.has(ai)) return;
        const bi = b.findIndex(
          (other, candidate) =>
            !used.has(candidate) &&
            other.id === course.id &&
            (!exact || other.lock === course.lock),
        );
        if (bi >= 0) {
          used.add(bi);
          matches.set(ai, bi);
        }
      });
    function unmatched(course: PlannedCourse, other: Plan): CourseDifference {
      return other.semesters.some(
        (term) =>
          term.index !== index && term.courses.some((c) => c.id === course.id),
      )
        ? "different-term"
        : "only-here";
    }
    const opposite = new Map([...matches].map(([ai, bi]) => [bi, ai]));
    return {
      index,
      leftPresent: leftTerms.has(index),
      rightPresent: rightTerms.has(index),
      left: a.map((course, ai) => ({
        course,
        difference: matches.has(ai)
          ? course.lock === b[matches.get(ai)!].lock
            ? "same"
            : "lock-changed"
          : unmatched(course, right),
      })),
      right: b.map((course, bi) => ({
        course,
        difference: opposite.has(bi)
          ? course.lock === a[opposite.get(bi)!].lock
            ? "same"
            : "lock-changed"
          : unmatched(course, left),
      })),
    };
  });
}
/** Written by Michael's Codex. Duplicate always inserts a new owned row, with no inherited ACL/deletion metadata. */
export function duplicatePlan(source: Plan, now = new Date()): Plan {
  const stamp = now.toISOString();
  return structuredClone({
    ...source,
    id: null,
    user_id: null,
    can_view: [],
    deletion_scheduled_at: null,
    created_at: stamp,
    last_updated: stamp,
    title: `${(source.title || "Untitled plan").slice(0, 290)} (copy)`,
  });
}
