import "server-only";
import type { CourseDetails, CourseId, CourseSummary, SrtMetric } from "@/domain/course";
import { extractPrereqText } from "@/domain/prereqs";
import { catalog } from "./db";
import { parseJson, toSummary, type CourseRow } from "./rows";

interface DetailsRow extends CourseRow {
  onestop: string | null;
  onestop_desc: string | null;
  total_students: number;
  total_grades: string;
  srt_vals: string | null;
  courseGroupId: string | null;
}

export const MAX_IDS_PER_REQUEST = 200;

function placeholders(n: number) {
  return Array.from({ length: n }, () => "?").join(",");
}

export function getCourses(ids: CourseId[]): CourseDetails[] {
  const unique = [...new Set(ids)].slice(0, MAX_IDS_PER_REQUEST);
  if (unique.length === 0) return [];
  const db = catalog();
  const ph = placeholders(unique.length);

  const rows = db
    .prepare(
      `SELECT id, dept_abbr, course_num, class_desc, cred_min, cred_max, onestop, onestop_desc,
              total_students, total_grades, srt_vals, courseGroupId
       FROM classdistribution WHERE id IN (${ph})`,
    )
    .all(...unique) as unknown as DetailsRow[];

  const libEds = new Map<number, string[]>();
  for (const r of db
    .prepare(
      // libedAssociationTable: left_id → libed.id, right_id → classdistribution.id
      `SELECT a.right_id AS id, l.name AS name FROM libedAssociationTable a
       JOIN libed l ON l.id = a.left_id WHERE a.right_id IN (${ph}) ORDER BY l.name`,
    )
    .all(...unique) as unknown as { id: number; name: string }[]) {
    libEds.set(r.id, [...(libEds.get(r.id) ?? []), r.name]);
  }

  const terms = new Map<number, string[]>();
  for (const r of db
    .prepare(
      `SELECT DISTINCT d.class_id AS id, t.term AS term FROM distribution d
       JOIN termdistribution t ON t.dist_id = d.id WHERE d.class_id IN (${ph}) ORDER BY t.term`,
    )
    .all(...unique) as unknown as { id: number; term: number }[]) {
    terms.set(r.id, [...(terms.get(r.id) ?? []), String(r.term)]);
  }

  const byId = new Map(rows.map((r) => [r.id, r]));
  return unique.flatMap((id) => {
    const r = byId.get(id);
    if (!r) return [];
    const srtRaw = parseJson<Record<string, { val: number; respondents: number }>>(r.srt_vals, {});
    const srt: Record<string, SrtMetric> = {};
    for (const [k, v] of Object.entries(srtRaw)) srt[k] = { value: v.val, respondents: v.respondents };
    return [
      {
        ...toSummary(r),
        description: r.onestop_desc ?? "",
        catalogUrl: r.onestop,
        courseGroupId: r.courseGroupId,
        grades: parseJson<Record<string, number>>(r.total_grades, {}),
        totalStudents: r.total_students,
        srt,
        libEds: libEds.get(id) ?? [],
        termsOffered: terms.get(id) ?? [],
        prereqText: extractPrereqText(r.onestop_desc),
      },
    ];
  });
}

/** Look up courses by code, e.g. for transcript import: [{dept:"CSCI", number:"2041"}]. */
export function findCourseIdsByCode(codes: { dept: string; number: string }[]): Map<string, CourseId> {
  const out = new Map<string, CourseId>();
  const stmt = catalog().prepare(
    `SELECT id FROM classdistribution WHERE campus = 'UMNTC' AND dept_abbr = ? AND course_num = ? LIMIT 1`,
  );
  for (const { dept, number } of codes) {
    const row = stmt.get(dept.toUpperCase(), number.toUpperCase()) as { id: number } | undefined;
    if (row) out.set(`${dept.toUpperCase()} ${number.toUpperCase()}`, row.id);
  }
  return out;
}

/** Twin Cities catalog courses keyed by CourseDog course group id (for program requirements). */
export function findCoursesByGroupIds(groupIds: string[]): Map<string, CourseSummary> {
  const out = new Map<string, CourseSummary>();
  const unique = [...new Set(groupIds)];
  for (let i = 0; i < unique.length; i += 500) {
    const chunk = unique.slice(i, i + 500);
    const rows = catalog()
      .prepare(
        `SELECT id, dept_abbr, course_num, class_desc, cred_min, cred_max, courseGroupId FROM classdistribution
         WHERE campus = 'UMNTC' AND courseGroupId IN (${placeholders(chunk.length)}) ORDER BY id`,
      )
      .all(...chunk) as unknown as (CourseRow & { courseGroupId: string })[];
    for (const r of rows) if (!out.has(r.courseGroupId)) out.set(r.courseGroupId, toSummary(r));
  }
  return out;
}
