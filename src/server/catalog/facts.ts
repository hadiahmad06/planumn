import "server-only";
import type { CourseId } from "@/domain/course";
import { offeringHistory, seenSeasons } from "@/domain/health";
import { extractPrereqText } from "@/domain/prereqs";
import type { CourseFacts } from "@/domain/searchFilters";
import { averageGpa } from "@/domain/workload";
import { CAMPUS, catalog, splitTerms } from "./db";
import { parseJson } from "./rows";

let facts: Promise<Map<CourseId, CourseFacts>> | null = null;

/**
 * Filterable facts for every Twin Cities course (B8), built once per server process (once per
 * Worker isolate on Cloudflare). The catalog is read-only, so this never goes stale.
 */
export function courseFacts(): Promise<Map<CourseId, CourseFacts>> {
  facts ??= loadFacts().catch((err) => {
    facts = null;
    throw err;
  });
  return facts;
}

async function loadFacts(): Promise<Map<CourseId, CourseFacts>> {
  const rows = await (await catalog()).all<{
    id: number;
    course_num: string;
    cred_min: number | null;
    cred_max: number | null;
    total_grades: string;
    onestop_desc: string | null;
    terms: string | null;
  }>(
    `SELECT c.id, c.course_num, c.cred_min, c.cred_max, c.total_grades, c.onestop_desc, t.terms
     FROM classdistribution c LEFT JOIN course_terms t ON t.class_id = c.id WHERE c.campus = ?`,
    CAMPUS,
  );
  return new Map(
    rows.map((r) => {
      const min = r.cred_min ?? r.cred_max ?? 0;
      const offering = offeringHistory(splitTerms(r.terms));
      return [
        r.id,
        {
          number: r.course_num,
          credits: { min, max: r.cred_max ?? min },
          seasons: offering.known || offering.limited ? seenSeasons(offering) : null,
          limitedTerms: offering.limited ? offering.termCount : null,
          gpa: averageGpa(parseJson<Record<string, number>>(r.total_grades, {})),
          hasPrereqs: extractPrereqText(r.onestop_desc) !== null,
        },
      ];
    }),
  );
}
