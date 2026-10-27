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

export interface Semester {
  /** UMN term code, e.g. "1259" = Fall 2025. */
  index: TermCode;
  courses: PlannedCourse[];
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
  return plan.semesters.every((s) => s.courses.length === 0);
}

export function plannedCourseIds(plan: Plan): CourseId[] {
  return [...new Set(plan.semesters.flatMap((s) => s.courses.map((c) => c.id)))];
}

/** Sort semesters by term and drop duplicate term codes (merging their courses). */
export function normalizeSemesters(semesters: Semester[]): Semester[] {
  const byTerm = new Map<TermCode, Semester>();
  for (const s of semesters) {
    const existing = byTerm.get(s.index);
    if (existing) existing.courses.push(...s.courses);
    else byTerm.set(s.index, { index: s.index, courses: [...s.courses] });
  }
  return [...byTerm.values()].sort((a, b) => Number(a.index) - Number(b.index));
}
