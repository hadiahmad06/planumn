import "server-only";
import { catalog, CAMPUS } from "./db";
import type { InstructorInsight } from "@/features/preview/instructor";

interface Row {
  id: number;
  name: string;
  term: number;
  students: number;
  grades: string;
}
/** Written by Michael's Codex. Instructor × term rows for one Twin Cities course, from the bundled catalog. */
export function getInstructorInsights(courseId: number): InstructorInsight[] {
  if (!Number.isSafeInteger(courseId) || courseId <= 0) return [];
  const rows = catalog()
    .prepare(
      `
    SELECT p.id, p.name, t.term, t.students, t.grades
    FROM classdistribution c
    JOIN distribution d ON d.class_id = c.id
    JOIN professor p ON p.id = d.professor_id
    JOIN termdistribution t ON t.dist_id = d.id
    WHERE c.id = ? AND c.campus = ?
    ORDER BY lower(p.name), p.id, t.term
  `,
    )
    .all(courseId, CAMPUS) as unknown as Row[];
  const found = new Map<number, InstructorInsight>();
  for (const row of rows) {
    const instructor = found.get(row.id) ?? {
      id: row.id,
      name: row.name,
      terms: [],
      students: 0,
      grades: {},
    };
    const term = String(row.term);
    if (/^1\d{2}[359]$/.test(term) && !instructor.terms.includes(term))
      instructor.terms.push(term);
    if (Number.isFinite(row.students) && row.students > 0)
      instructor.students += row.students;
    try {
      const grades: unknown = JSON.parse(row.grades);
      if (grades && typeof grades === "object" && !Array.isArray(grades)) {
        for (const [grade, count] of Object.entries(grades))
          if (typeof count === "number" && Number.isFinite(count) && count > 0)
            instructor.grades[grade] = (instructor.grades[grade] ?? 0) + count;
      }
    } catch {
      /* Keep the known instructor/term even when a source grade row is unavailable. */
    }
    found.set(row.id, instructor);
  }
  return [...found.values()];
}
