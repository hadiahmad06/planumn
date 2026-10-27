import {
  normalizeSemesters,
  type Plan,
  type PlannedCourse,
  type PlaceholderCourse,
  type Semester,
  type SemesterKind,
} from "@/domain/plan";

export type CourseDifference =
  "same" | "lock-changed" | "different-term" | "only-here";
export interface ComparedCourse {
  course: PlannedCourse;
  difference: CourseDifference;
}
export interface ComparedPlaceholder {
  placeholder: PlaceholderCourse;
  difference: "same" | "changed" | "different-term" | "only-here";
}
export interface ComparedTerm {
  /** Prior credit is one logical bucket even when plans use different synthetic term indices. */
  key: string;
  index: string;
  leftKind?: SemesterKind;
  rightKind?: SemesterKind;
  leftSlots: ComparedPlaceholder[];
  rightSlots: ComparedPlaceholder[];
  leftPresent: boolean;
  rightPresent: boolean;
  left: ComparedCourse[];
  right: ComparedCourse[];
}
/** Written by Michael's Codex. Placeholder keys identify edits; equal content also matches across independent plans. */
const semesterKey = (term: Semester) =>
  term.kind === "prior" ? "prior" : term.index;
const sameSlot = (a: PlaceholderCourse, b: PlaceholderCourse) =>
  a.label === b.label && a.credits === b.credits && a.libEd === b.libEd;
function compareSlots(
  a: PlaceholderCourse[],
  b: PlaceholderCourse[],
  key: string,
  opposite: Plan,
): ComparedPlaceholder[] {
  const used = new Set<number>();
  const matches = new Map<number, number>();
  for (const exact of [true, false])
    a.forEach((slot, ai) => {
      if (matches.has(ai)) return;
      const bi = b.findIndex(
        (other, i) =>
          !used.has(i) &&
          (exact ? sameSlot(slot, other) : slot.key === other.key),
      );
      if (bi >= 0) {
        matches.set(ai, bi);
        used.add(bi);
      }
    });
  return a.map((placeholder, ai) => {
    const match = matches.get(ai);
    const difference =
      match !== undefined
        ? sameSlot(placeholder, b[match])
          ? "same"
          : "changed"
        : opposite.semesters.some(
              (term) =>
                semesterKey(term) !== key &&
                term.placeholders?.some((other) =>
                  sameSlot(placeholder, other),
                ),
            )
          ? "different-term"
          : "only-here";
    return { placeholder, difference };
  });
}
/** Written by Michael's Codex. Pair equal locks first, then remaining retakes, without mutating either plan. */
export function comparePlans(left: Plan, right: Plan): ComparedTerm[] {
  const leftTerms = new Map(
    normalizeSemesters(left.semesters).map((term) => [semesterKey(term), term]),
  );
  const rightTerms = new Map(
    normalizeSemesters(right.semesters).map((term) => [
      semesterKey(term),
      term,
    ]),
  );
  const indices = [
    ...new Set([...leftTerms.keys(), ...rightTerms.keys()]),
  ].sort((a, b) =>
    a === b
      ? 0
      : a === "prior"
        ? -1
        : b === "prior"
          ? 1
          : Number(a) - Number(b),
  );
  return indices.map((index) => {
    const leftTerm = leftTerms.get(index),
      rightTerm = rightTerms.get(index);
    const a = leftTerm?.courses ?? [],
      b = rightTerm?.courses ?? [];
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
          semesterKey(term) !== index &&
          term.courses.some((c) => c.id === course.id),
      )
        ? "different-term"
        : "only-here";
    }
    const opposite = new Map([...matches].map(([ai, bi]) => [bi, ai]));
    return {
      key: index,
      index: (leftTerm ?? rightTerm)!.index,
      leftKind: leftTerm?.kind,
      rightKind: rightTerm?.kind,
      leftSlots: compareSlots(
        leftTerm?.placeholders ?? [],
        rightTerm?.placeholders ?? [],
        index,
        right,
      ),
      rightSlots: compareSlots(
        rightTerm?.placeholders ?? [],
        leftTerm?.placeholders ?? [],
        index,
        left,
      ),
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
