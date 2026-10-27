import type { CourseId, CreditRange } from "./course";
import { MAX_PLACEHOLDERS_PER_SEMESTER, type LockState, type Plan, type PlannedCourse, type Semester } from "./plan";
import { academicYear, nextTerm, seasonOf, toTermCode, type Season, type TermCode } from "./terms";

/**
 * Pure plan edits. Each returns a new Plan (or the same object when nothing changes).
 * The editor store wraps these; tests cover them directly.
 */

export interface CourseSlot {
  term: TermCode;
  index: number;
}

function mapSemester(plan: Plan, term: TermCode, fn: (s: Semester) => Semester): Plan {
  let changed = false;
  const semesters = plan.semesters.map((s) => {
    if (s.index !== term) return s;
    const next = fn(s);
    if (next !== s) changed = true;
    return next;
  });
  return changed ? { ...plan, semesters } : plan;
}

export function findSemester(plan: Plan, term: TermCode): Semester | undefined {
  return plan.semesters.find((s) => s.index === term);
}

export function hasCourse(plan: Plan, term: TermCode, id: CourseId): boolean {
  return findSemester(plan, term)?.courses.some((c) => c.id === id) ?? false;
}

/** Insert a course into a semester. No-op if that semester already has it. */
export function addCourse(plan: Plan, term: TermCode, id: CourseId, index?: number, lock: LockState = "unlocked"): Plan {
  if (hasCourse(plan, term, id)) return plan;
  return mapSemester(plan, term, (s) => {
    const courses = [...s.courses];
    courses.splice(index ?? courses.length, 0, { id, lock });
    return { ...s, courses };
  });
}

export function removeCourse(plan: Plan, term: TermCode, id: CourseId): Plan {
  return mapSemester(plan, term, (s) =>
    s.courses.some((c) => c.id === id) ? { ...s, courses: s.courses.filter((c) => c.id !== id) } : s,
  );
}

/**
 * Move the course at `from` to `to` (index in the destination after removal).
 * Locked courses don't move; moving onto a semester that already has the course is a no-op.
 */
export function moveCourse(plan: Plan, from: CourseSlot, to: CourseSlot): Plan {
  const src = findSemester(plan, from.term);
  const course = src?.courses[from.index];
  if (!src || !course || course.lock === "locked") return plan;
  if (from.term === to.term) {
    if (from.index === to.index) return plan;
    return mapSemester(plan, from.term, (s) => {
      const courses = [...s.courses];
      courses.splice(from.index, 1);
      courses.splice(Math.min(to.index, courses.length), 0, course);
      return { ...s, courses };
    });
  }
  if (!findSemester(plan, to.term) || hasCourse(plan, to.term, course.id)) return plan;
  const removed = mapSemester(plan, from.term, (s) => ({ ...s, courses: s.courses.filter((_, i) => i !== from.index) }));
  return mapSemester(removed, to.term, (s) => {
    const courses = [...s.courses];
    courses.splice(Math.min(to.index, courses.length), 0, course);
    return { ...s, courses };
  });
}

/** Move a course to the end of another term, adding that semester if the plan doesn't have it. */
export function moveCourseToTerm(plan: Plan, from: TermCode, id: CourseId, to: TermCode): Plan {
  if (from === to) return plan;
  const index = findSemester(plan, from)?.courses.findIndex((c) => c.id === id) ?? -1;
  if (index < 0) return plan;
  const withTarget = findSemester(plan, to) ? plan : addSemester(plan, to);
  const moved = moveCourse(withTarget, { term: from, index }, { term: to, index: findSemester(withTarget, to)!.courses.length });
  return moved === withTarget ? plan : moved;
}

export function setLock(plan: Plan, term: TermCode, id: CourseId, lock: LockState): Plan {
  return mapSemester(plan, term, (s) => ({
    ...s,
    courses: s.courses.map((c): PlannedCourse => (c.id === id ? { ...c, lock } : c)),
  }));
}

export function setPrograms(plan: Plan, programs: string[]): Plan {
  const next = [...new Set(programs)];
  return next.length === plan.programs.length && next.every((p, i) => p === plan.programs[i]) ? plan : { ...plan, programs: next };
}

export function setTitle(plan: Plan, title: string): Plan {
  return plan.title === title ? plan : { ...plan, title };
}

function sortSemesters(semesters: Semester[]): Semester[] {
  return [...semesters].sort((a, b) => Number(a.index) - Number(b.index));
}

/**
 * Add one semester right after the last one (Fall → Spring → Summer → Fall), skipping seasons the
 * user has hidden so the new semester is visible.
 */
export function addNextSemester(plan: Plan, skip: Season[] = []): Plan {
  const last = sortSemesters(plan.semesters).at(-1)?.index;
  let term = last ? nextTerm(last) : toTermCode({ year: new Date().getFullYear(), season: "fall" });
  for (let i = 0; i < 3 && skip.includes(seasonOf(term)); i++) term = nextTerm(term);
  return addSemester(plan, term);
}

/** Add a full academic year (Fall, Spring, Summer) after the last year. */
export function addYearAtEnd(plan: Plan): Plan {
  const last = plan.semesters.at(-1)?.index;
  if (!last) return addNextSemester(plan);
  const startFall = toTermCode({ year: academicYear(last) + 1, season: "fall" });
  return addYear(plan, startFall);
}

/** Add a full academic year before the first year (e.g. for courses taken earlier). */
export function addYearAtStart(plan: Plan): Plan {
  const first = plan.semesters[0]?.index;
  if (!first) return addNextSemester(plan);
  return addYear(plan, toTermCode({ year: academicYear(first) - 1, season: "fall" }));
}

function addYear(plan: Plan, fall: TermCode): Plan {
  const terms = [fall, nextTerm(fall), nextTerm(nextTerm(fall))];
  const existing = new Set(plan.semesters.map((s) => s.index));
  const added = terms.filter((t) => !existing.has(t)).map((index) => ({ index, courses: [] }));
  return added.length ? { ...plan, semesters: sortSemesters([...plan.semesters, ...added]) } : plan;
}

/** Add one specific term (e.g. re-adding a removed Summer). */
export function addSemester(plan: Plan, term: TermCode): Plan {
  if (findSemester(plan, term)) return plan;
  return { ...plan, semesters: sortSemesters([...plan.semesters, { index: term, courses: [] }]) };
}

export function removeSemester(plan: Plan, term: TermCode): Plan {
  return plan.semesters.some((s) => s.index === term)
    ? { ...plan, semesters: plan.semesters.filter((s) => s.index !== term) }
    : plan;
}

export function removeYear(plan: Plan, startYear: number): Plan {
  const semesters = plan.semesters.filter((s) => academicYear(s.index) !== startYear);
  return semesters.length === plan.semesters.length ? plan : { ...plan, semesters };
}

export interface YearGroup {
  startYear: number;
  semesters: Semester[];
}

/** Group semesters by academic year (Fall + following Spring + Summer). */
export function groupByYear(semesters: Semester[]): YearGroup[] {
  const groups = new Map<number, Semester[]>();
  for (const s of sortSemesters(semesters)) {
    const y = academicYear(s.index);
    groups.set(y, [...(groups.get(y) ?? []), s]);
  }
  return [...groups.entries()].map(([startYear, semesters]) => ({ startYear, semesters }));
}

/** The terms of an academic year that are missing from the plan (for "re-add Summer"). */
export function missingTermsInYear(plan: Plan, startYear: number): TermCode[] {
  const fall = toTermCode({ year: startYear, season: "fall" });
  const terms = [fall, nextTerm(fall), nextTerm(nextTerm(fall))];
  return terms.filter((t) => !findSemester(plan, t));
}

export function sumCredits(ranges: CreditRange[]): CreditRange {
  return ranges.reduce((acc, r) => ({ min: acc.min + r.min, max: acc.max + r.max }), { min: 0, max: 0 });
}


// ---------------------------------------------------------------------------
// Placeholder courses (B2, Ishaan's Claude)

export interface PlaceholderInput {
  label: string;
  credits: number;
  libEd?: string;
}

/** Clean a placeholder from the UI: trimmed 1–80 char label, 0–20 credits (whole or half). */
export function cleanPlaceholder(input: PlaceholderInput): PlaceholderInput | null {
  const label = input.label.trim().replace(/\s+/g, " ").slice(0, 80);
  const credits = Math.round(input.credits * 2) / 2;
  if (!label || !Number.isFinite(credits) || credits < 0 || credits > 20) return null;
  return { label, credits, ...(input.libEd ? { libEd: input.libEd } : {}) };
}

/** Add a placeholder to a semester. `key` must be unique in that semester (no-op if it isn't). */
export function addPlaceholder(plan: Plan, term: TermCode, input: PlaceholderInput, key: string): Plan {
  const clean = cleanPlaceholder(input);
  if (!clean) return plan;
  return mapSemester(plan, term, (s) => {
    const list = s.placeholders ?? [];
    if (list.length >= MAX_PLACEHOLDERS_PER_SEMESTER || list.some((p) => p.key === key)) return s;
    return { ...s, placeholders: [...list, { key, ...clean }] };
  });
}

export function removePlaceholder(plan: Plan, term: TermCode, key: string): Plan {
  return mapSemester(plan, term, (s) =>
    s.placeholders?.some((p) => p.key === key) ? { ...s, placeholders: s.placeholders.filter((p) => p.key !== key) } : s,
  );
}
