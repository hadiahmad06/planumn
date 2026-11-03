import "server-only";
import type { CourseId } from "@/domain/course";
import { offeringHistory } from "@/domain/health";
import { extractPrereqText } from "@/domain/prereqs";
import type { CourseFacts } from "@/domain/searchFilters";
import { averageGpa } from "@/domain/workload";
import { CAMPUS, catalog } from "./db";
import { parseJson } from "./rows";

let facts: Map<CourseId, CourseFacts> | null = null;

/**
 * Filterable facts for every Twin Cities course (B8), built once per server process. The catalog is
 * read-only, so this never goes stale.
 */
export function courseFacts(): Map<CourseId, CourseFacts> {
  if (facts) return facts;
  const db = catalog();
  const terms = new Map<CourseId, string[]>();
  for (const r of db
    .prepare(
      `SELECT DISTINCT d.class_id AS id, t.term AS term FROM distribution d
       JOIN termdistribution t ON t.dist_id = d.id
       JOIN classdistribution c ON c.id = d.class_id WHERE c.campus = ?`,
    )
    .all(CAMPUS) as unknown as { id: number; term: number }[]) {
    terms.set(r.id, [...(terms.get(r.id) ?? []), String(r.term)]);
  }

  const rows = db
    .prepare(`SELECT id, course_num, cred_min, cred_max, total_grades, onestop_desc FROM classdistribution WHERE campus = ?`)
    .all(CAMPUS) as unknown as {
    id: number;
    course_num: string;
    cred_min: number | null;
    cred_max: number | null;
    total_grades: string;
    onestop_desc: string | null;
  }[];
  facts = new Map(
    rows.map((r) => {
      const min = r.cred_min ?? r.cred_max ?? 0;
      const offering = offeringHistory(terms.get(r.id) ?? []);
      return [
        r.id,
        {
          number: r.course_num,
          credits: { min, max: r.cred_max ?? min },
          seasons: offering.known ? offering.seasons : null,
          gpa: averageGpa(parseJson<Record<string, number>>(r.total_grades, {})),
          hasPrereqs: extractPrereqText(r.onestop_desc) !== null,
        },
      ];
    }),
  );
  return facts;
}
