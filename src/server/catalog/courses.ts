import "server-only";
import type { CourseDetails, CourseId, CourseSummary, SrtMetric } from "@/domain/course";
import { extractPrereqText } from "@/domain/prereqs";
import { optionFromRows, type CourseOption } from "@/domain/requirements";
import { catalog, jsonList, splitTerms } from "./db";
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

/**
 * SRT means per metric. GopherGrades stores flat means (out of 6) plus one `RESP` total,
 * `{ DEEP_UND: 5.03, …, RESP: 1989 }` (D1; the 2025 build had `{ val, respondents }` per metric).
 * Every metric gets the `RESP` total, since per-metric counts aren't kept.
 */
export function parseSrt(raw: string | null): Record<string, SrtMetric> {
  const vals = parseJson<Record<string, unknown>>(raw, {}) ?? {};
  const total = typeof vals.RESP === "number" ? vals.RESP : 0;
  const srt: Record<string, SrtMetric> = {};
  for (const [k, v] of Object.entries(vals)) if (k !== "RESP" && typeof v === "number") srt[k] = { value: v, respondents: total };
  return srt;
}

export async function getCourses(ids: CourseId[]): Promise<CourseDetails[]> {
  const unique = [...new Set(ids)].slice(0, MAX_IDS_PER_REQUEST);
  if (unique.length === 0) return [];
  const db = await catalog();
  const list = jsonList(unique);

  const [rows, libEdRows, termRows] = await Promise.all([
    db.all<DetailsRow>(
      `SELECT id, dept_abbr, course_num, class_desc, cred_min, cred_max, onestop, onestop_desc,
              total_students, total_grades, srt_vals, courseGroupId
       FROM classdistribution WHERE id IN (SELECT value FROM json_each(?))`,
      list,
    ),
    // libedAssociationTable: left_id → libed.id, right_id → classdistribution.id
    db.all<{ id: number; name: string }>(
      `SELECT a.right_id AS id, l.name AS name FROM libedAssociationTable a
       JOIN libed l ON l.id = a.left_id WHERE a.right_id IN (SELECT value FROM json_each(?)) ORDER BY l.name`,
      list,
    ),
    db.all<{ id: number; terms: string }>(
      `SELECT class_id AS id, terms FROM course_terms WHERE class_id IN (SELECT value FROM json_each(?))`,
      list,
    ),
  ]);

  const libEds = new Map<number, string[]>();
  for (const r of libEdRows) libEds.set(r.id, [...(libEds.get(r.id) ?? []), r.name]);
  const terms = new Map(termRows.map((r) => [r.id, splitTerms(r.terms)]));

  const byId = new Map(rows.map((r) => [r.id, r]));
  return unique.flatMap((id) => {
    const r = byId.get(id);
    if (!r) return [];
    const srt = parseSrt(r.srt_vals);
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
export async function findCourseIdsByCode(codes: { dept: string; number: string }[]): Promise<Map<string, CourseId>> {
  const out = new Map<string, CourseId>();
  const wanted = [...new Set(codes.map(({ dept, number }) => `${dept.toUpperCase()} ${number.toUpperCase()}`))];
  if (wanted.length === 0) return out;
  const pairs = wanted.map((code) => code.split(" "));
  // One indexed lookup per code; the lowest id wins when a code repeats.
  const rows = await (await catalog()).all<{ code: string; id: number }>(
    `SELECT c.dept_abbr || ' ' || c.course_num AS code, MIN(c.id) AS id
     FROM json_each(?) j JOIN classdistribution c
       ON c.campus = 'UMNTC' AND c.dept_abbr = json_extract(j.value, '$[0]') AND c.course_num = json_extract(j.value, '$[1]')
     GROUP BY c.dept_abbr, c.course_num`,
    JSON.stringify(pairs),
  );
  for (const r of rows) out.set(r.code, r.id);
  return out;
}

/** A Twin Cities catalog row of a CourseDog course group, with its newest offering (L11). */
export interface GroupRow extends CourseSummary {
  /** Newest term with recorded grades ("1265", from `course_terms`), or null if none. */
  lastTerm: string | null;
}

/**
 * Twin Cities catalog rows keyed by CourseDog course group id (for program requirements). L11: **every**
 * row of a group, since a renumbered course keeps its group id (ENGW 1102 and ENGW 1102W share `0049451`);
 * `optionFromRows` orders them (newest offering first).
 */
export async function findCourseRowsByGroupIds(groupIds: string[]): Promise<Map<string, GroupRow[]>> {
  const out = new Map<string, GroupRow[]>();
  const unique = [...new Set(groupIds)];
  const db = await catalog();
  // Chunked so each statement stays well under D1's 100 KB statement limit.
  for (let i = 0; i < unique.length; i += 1000) {
    const rows = await db.all<CourseRow & { courseGroupId: string; terms: string | null }>(
      `SELECT c.id, c.dept_abbr, c.course_num, c.class_desc, c.cred_min, c.cred_max, c.courseGroupId, t.terms
       FROM classdistribution c LEFT JOIN course_terms t ON t.class_id = c.id
       WHERE c.campus = 'UMNTC' AND c.courseGroupId IN (SELECT value FROM json_each(?)) ORDER BY c.id`,
      jsonList(unique.slice(i, i + 1000)),
    );
    for (const r of rows) {
      const terms = splitTerms(r.terms);
      const lastTerm = terms.length ? terms.reduce((a, b) => (b > a ? b : a)) : null;
      out.set(r.courseGroupId, [...(out.get(r.courseGroupId) ?? []), { ...toSummary(r), lastTerm }]);
    }
  }
  return out;
}

/** L11: an option from a group's catalog rows (every row satisfies it; the newest offering is suggested). */
export function catalogOption(groupId: string, rows: GroupRow[]): CourseOption {
  return optionFromRows(
    groupId,
    rows.map((r) => ({ courseId: r.id, code: `${r.dept} ${r.number}`, title: r.title, credits: r.credits, lastTerm: r.lastTerm })),
  );
}

let departments: Promise<{ code: string; name: string }[]> | null = null;

/** Twin Cities departments (code + name), e.g. { code: "CSCI", name: "Computer Science" } (B27). */
export function listDepartments(): Promise<{ code: string; name: string }[]> {
  departments ??= catalog()
    .then((db) =>
      db.all<{ code: string; name: string }>(
        `SELECT dept_abbr AS code, dept_name AS name FROM departmentdistribution WHERE campus = 'UMNTC' ORDER BY dept_abbr`,
      ),
    )
    .catch((err) => {
      departments = null;
      throw err;
    });
  return departments;
}
