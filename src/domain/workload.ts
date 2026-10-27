import type { CourseId, GradeCounts } from "./course";

/**
 * Semester workload meter (Phase B: B7). A rough signal from historical grades (GopherGrades, through
 * Fall 2024) and credits, not a measure of difficulty. Grades don't capture effort; the UI says so.
 */
const POINTS: Record<string, number> = {
  A: 4, "A-": 3.667, "B+": 3.333, B: 3, "B-": 2.667, "C+": 2.333, C: 2, "C-": 1.667, "D+": 1.333, D: 1, F: 0,
};

/** Mean grade points over letter grades (S/N/P/W ignored). null with fewer than 20 letter grades. */
export function averageGpa(grades: GradeCounts): number | null {
  let n = 0;
  let sum = 0;
  for (const [g, count] of Object.entries(grades)) {
    if (POINTS[g] === undefined || !(count > 0)) continue;
    n += count;
    sum += POINTS[g] * count;
  }
  return n >= 20 ? sum / n : null;
}

export type WorkloadLevel = "light" | "moderate" | "heavy";

export interface Workload {
  level: WorkloadLevel;
  credits: number;
  /** Credit-weighted average GPA of the courses with enough grade data, or null. */
  gpa: number | null;
}

/** Heavy: lots of credits in low-GPA courses. Light: a modest load of high-GPA courses. */
export function semesterWorkload(courses: { credits: number; grades: GradeCounts }[]): Workload {
  const credits = courses.reduce((n, c) => n + c.credits, 0);
  let weight = 0;
  let sum = 0;
  for (const c of courses) {
    const g = averageGpa(c.grades);
    if (g === null) continue;
    weight += c.credits;
    sum += g * c.credits;
  }
  const gpa = weight > 0 ? sum / weight : null;
  // "Effort credits": a course with a 2.5 average counts more than a 3.7 one.
  const effort = courses.reduce((n, c) => {
    const g = averageGpa(c.grades);
    return n + c.credits * (g === null ? 1 : 1 + Math.max(0, 3.3 - g) / 1.3);
  }, 0);
  const level: WorkloadLevel = effort >= 20 ? "heavy" : effort <= 13 ? "light" : "moderate";
  return { level, credits, gpa };
}

export type WorkloadStatus =
  | { status: "empty" }
  /** Some course details haven't arrived yet: don't guess from the ones that have. */
  | { status: "loading" }
  /** Some courses aren't in the catalog, so the semester can't be rated honestly. */
  | { status: "incomplete"; unavailable: number }
  | { status: "ready"; workload: Workload };

/**
 * Rate a semester only once every planned course has catalog details (review fix by Ishaan's Claude
 * on #34: a partly cached four-course semester used to read as a one-course "light" semester).
 * `details` = courses with loaded details; `unavailable` = ids the catalog doesn't have.
 */
export function semesterWorkloadStatus(
  ids: CourseId[],
  details: Record<CourseId, { credits: { min: number }; grades: GradeCounts } | undefined>,
  unavailable: Record<CourseId, true | undefined>,
): WorkloadStatus {
  if (ids.length === 0) return { status: "empty" };
  const missing = ids.filter((id) => !details[id]);
  const gone = missing.filter((id) => unavailable[id]).length;
  if (gone > 0) return { status: "incomplete", unavailable: gone };
  if (missing.length > 0) return { status: "loading" };
  return { status: "ready", workload: semesterWorkload(ids.map((id) => ({ credits: details[id]!.credits.min, grades: details[id]!.grades }))) };
}
