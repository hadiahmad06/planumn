/** Course id = `classdistribution.id` in data/catalog.db. 2025 plans store these ids, so they must stay stable. */
export type CourseId = number;

export interface CreditRange {
  min: number;
  max: number;
}

/** Cheap shape for search results and schedule cards. */
export interface CourseSummary {
  id: CourseId;
  dept: string;
  number: string;
  title: string;
  credits: CreditRange;
}

export type GradeCounts = Record<string, number>;

/** Student Rating of Teaching metric, e.g. `DEEP_UND`, `EFFORT`, `RECC`. */
export interface SrtMetric {
  value: number;
  respondents: number;
}

export interface CourseDetails extends CourseSummary {
  description: string;
  catalogUrl: string | null;
  /** CourseDog course group id, used to match program requirement rules. */
  courseGroupId: string | null;
  /** Grades across every recorded term (GopherGrades), e.g. { A: 120, "A-": 40, ... }. */
  grades: GradeCounts;
  totalStudents: number;
  srt: Record<string, SrtMetric>;
  /** Liberal Education / Writing Intensive designations, e.g. "Writing Intensive". */
  libEds: string[];
  /** Term codes that have recorded grades, oldest first. A hint at when the course is offered. */
  termsOffered: string[];
  /** Prerequisite clause from the catalog description, e.g. "(CSci 1913 or CSci 1933) and CSci 2011". */
  prereqText: string | null;
}

export function courseCode(c: Pick<CourseSummary, "dept" | "number">): string {
  return `${c.dept} ${c.number}`;
}

/**
 * Suffixed versions satisfy the base course: honors ("CSCI 1933H", "PHYS 1401V") and writing-intensive
 * ("PHYS 1301W") count as "CSCI 1933" / "PHYS 1401" / "PHYS 1301", as prerequisites list the base number.
 */
export function equivalentCodes(code: string): string[] {
  return /\d[HVW]$/.test(code) ? [code, code.slice(0, -1)] : [code];
}

export function formatCredits({ min, max }: CreditRange): string {
  return min === max ? `${min}` : `${min}–${max}`;
}

/** Course level bucket from its number: "2041" → 2000. */
export function courseLevel(number: string): number {
  const n = Number.parseInt(number, 10);
  return Number.isNaN(n) ? 0 : Math.floor(n / 1000) * 1000;
}
