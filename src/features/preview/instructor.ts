import type { GradeCounts } from "@/domain/course";
/** Written by Michael's Codex. Public historical catalog aggregates; no student records. */
export interface InstructorInsight {
  id: number;
  name: string;
  terms: string[];
  students: number;
  grades: GradeCounts;
}
const POINTS: Record<string, number> = {
  A: 4,
  "A-": 3.667,
  "B+": 3.333,
  B: 3,
  "B-": 2.667,
  "C+": 2.333,
  C: 2,
  "C-": 1.667,
  "D+": 1.333,
  D: 1,
  F: 0,
};
export function instructorGradeSummary(grades: GradeCounts) {
  let total = 0,
    letters = 0,
    points = 0;
  for (const [grade, count] of Object.entries(grades)) {
    if (!Number.isFinite(count) || count <= 0) continue;
    total += count;
    if (POINTS[grade] !== undefined) {
      letters += count;
      points += POINTS[grade] * count;
    }
  }
  return { total, letters, gpa: letters >= 20 ? points / letters : null };
}
