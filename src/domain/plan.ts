import type { CourseId } from "./course";
import { defaultStartTerm, termRange, type TermCode } from "./terms";

/**
 * Persisted plan shape. Field names match the 2025 Supabase `plans` table on purpose,
 * so plans saved by the 2025 app load unchanged.
 */

export type LockState = "locked" | "unlocked" | "autofilled";

export interface PlannedCourse {
  id: CourseId;
  lock: LockState;
}

/**
 * A course slot without a specific course yet (B2, Ishaan's Claude): "CSCI 3xxx elective",
 * "Lib Ed: Global Perspectives". Its credits count toward semester and plan totals.
 */
export interface PlaceholderCourse {
  /** Unique within its semester. */
  key: string;
  label: string;
  credits: number;
  /** Twin Cities Lib Ed (CLE) code the slot is meant to cover, e.g. "GP" (see domain/libed.ts). */
  libEd?: string;
}

export interface Semester {
  /** UMN term code, e.g. "1259" = Fall 2025. */
  index: TermCode;
  courses: PlannedCourse[];
  /** Optional (B2): absent on 2025 rows, which keep loading unchanged. */
  placeholders?: PlaceholderCourse[];
  /** Optional (B19): a non-regular term. Absent = a regular semester (all 2025 rows). */
  kind?: SemesterKind;
}

/** Special semesters (B19, Ishaan's Claude): study abroad, co-op / internship, leave of absence. */
export type SemesterKind = "abroad" | "coop" | "leave";
export const SEMESTER_KINDS: { kind: SemesterKind; label: string }[] = [
  { kind: "abroad", label: "Study abroad" },
  { kind: "coop", label: "Co-op / internship" },
  { kind: "leave", label: "Leave of absence" },
];
export const isSemesterKind = (v: unknown): v is SemesterKind => v === "abroad" || v === "coop" || v === "leave";

export const MAX_PLACEHOLDERS_PER_SEMESTER = 20;

/** Planned credits of a semester's placeholders. */
export function placeholderCredits(semester: Pick<Semester, "placeholders">): number {
  return (semester.placeholders ?? []).reduce((n, p) => n + p.credits, 0);
}

export interface Plan {
  /** null until first saved. */
  id: string | null;
  user_id: string | null;
  title: string;
  /** CourseDog program ids (e.g. "000821107"). */
  programs: string[];
  semesters: Semester[];
  can_view: string[];
  /** ISO timestamps. */
  created_at: string;
  last_updated: string;
  deletion_scheduled_at: string | null;
}

export const DEFAULT_PLAN_YEARS = 4;

export function createEmptyPlan(now = new Date()): Plan {
  const iso = now.toISOString();
  return {
    id: null,
    user_id: null,
    title: "",
    programs: [],
    semesters: termRange(defaultStartTerm(now), DEFAULT_PLAN_YEARS).map((index) => ({ index, courses: [] })),
    can_view: [],
    created_at: iso,
    last_updated: iso,
    deletion_scheduled_at: null,
  };
}

export function isPlanEmpty(plan: Plan): boolean {
  return plan.semesters.every((s) => s.courses.length === 0 && !s.placeholders?.length);
}

export function plannedCourseIds(plan: Plan): CourseId[] {
  return [...new Set(plan.semesters.flatMap((s) => s.courses.map((c) => c.id)))];
}

/**
 * Sort semesters by term and drop duplicate term codes, merging their courses (kept as-is, so older
 * rows' repeated entries survive for plan comparison) and placeholders (a key once per term).
 */
export function normalizeSemesters(semesters: Semester[]): Semester[] {
  const byTerm = new Map<TermCode, Semester>();
  for (const s of semesters) {
    const existing = byTerm.get(s.index);
    if (!existing) {
      byTerm.set(s.index, { ...s, courses: [...s.courses], ...(s.placeholders ? { placeholders: [...s.placeholders] } : {}) });
      continue;
    }
    existing.courses.push(...s.courses);
    for (const p of s.placeholders ?? []) {
      const list = (existing.placeholders ??= []);
      if (!list.some((e) => e.key === p.key)) list.push(p);
    }
  }
  return [...byTerm.values()].sort((a, b) => Number(a.index) - Number(b.index));
}
