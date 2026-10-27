import "server-only";
import type { CourseSummary } from "@/domain/course";
import { hasFilters, matchesFilters, type SearchFilters } from "@/domain/searchFilters";
import { CAMPUS, catalog } from "./db";
import { courseFacts } from "./facts";
import { toSummary, type CourseRow } from "./rows";

export interface ParsedQuery {
  dept: string | null;
  number: string | null;
  words: string[];
}

/**
 * "csci 2041" → dept CSCI, number 2041 · "csci2041h" → CSCI, 2041H · "2041" → number only
 * · "discrete math" → title words.
 */
export function parseQuery(raw: string): ParsedQuery {
  const q = raw.trim().toUpperCase().replace(/\s+/g, " ");
  const code = q.match(/^([A-Z]{2,4})\s?(\d{1,4}[A-Z]?)$/);
  if (code) return { dept: code[1], number: code[2], words: [] };
  if (/^\d{1,4}[A-Z]?$/.test(q)) return { dept: null, number: q, words: [] };
  if (/^[A-Z]{2,4}$/.test(q)) return { dept: q, number: null, words: [q] };
  return { dept: null, number: null, words: q.split(" ").filter(Boolean) };
}

/**
 * Text search, optionally narrowed by B8 filters. With filters, the query may be empty ("every Fall
 * 1xxx course"). `libEdGroups` holds the CourseDog course group ids carrying `filters.libEd`,
 * resolved by the caller from the UMN catalog.
 */
export function searchCourses(raw: string, limit = 50, filters: SearchFilters = {}, libEdGroups?: Set<string>): CourseSummary[] {
  // SQLite treats a negative LIMIT as "no limit", so never pass one through.
  const safeLimit = Number.isInteger(limit) ? Math.min(Math.max(limit, 1), 100) : 50;
  const { dept, number, words } = parseQuery(raw);
  const filtered = hasFilters(filters);
  if (!dept && !number && words.length === 0 && !filtered) return [];

  const where: string[] = ["campus = ?"];
  const params: (string | number)[] = [CAMPUS];
  // Lower priority number = better match.
  let priority = "";
  const priorityParams: string[] = [];

  if (dept && number) {
    where.push("dept_abbr = ?", "course_num LIKE ?");
    params.push(dept, `${number}%`);
    priority = "CASE WHEN course_num = ? THEN 0 ELSE 1 END";
    priorityParams.push(number);
  } else if (number) {
    where.push("course_num LIKE ?");
    params.push(`${number}%`);
  } else if (words.length > 0) {
    // A lone 2–4 letter word may be a department or a title word ("art", "math").
    const clauses = words.map(() => "UPPER(class_desc) LIKE ?");
    const titleMatch = clauses.join(" AND ");
    if (dept) {
      where.push(`(dept_abbr = ? OR (${titleMatch}))`);
      params.push(dept, ...words.map((w) => `%${w}%`));
      priority = "CASE WHEN dept_abbr = ? THEN 0 ELSE 1 END";
      priorityParams.push(dept);
    } else {
      where.push(titleMatch);
      params.push(...words.map((w) => `%${w}%`));
    }
  }

  const rows = catalog()
    .prepare(
      `SELECT id, dept_abbr, course_num, class_desc, cred_min, cred_max, courseGroupId
       FROM classdistribution
       WHERE ${where.join(" AND ")}
       ORDER BY ${priority ? `${priority}, ` : ""}dept_abbr, CAST(course_num AS INTEGER), course_num
       ${filtered ? "" : "LIMIT ?"}`,
    )
    .all(...params, ...priorityParams, ...(filtered ? [] : [safeLimit])) as unknown as (CourseRow & { courseGroupId: string | null })[];
  if (!filtered) return rows.map(toSummary);

  const facts = courseFacts();
  const only = filters.courseIds ? new Set(filters.courseIds) : null;
  const out: CourseSummary[] = [];
  for (const r of rows) {
    if (only && !only.has(r.id)) continue;
    if (filters.libEd && !(r.courseGroupId && libEdGroups?.has(r.courseGroupId))) continue;
    const f = facts.get(r.id);
    if (!f || !matchesFilters(f, filters)) continue;
    out.push(toSummary(r));
    if (out.length === safeLimit) break;
  }
  return out;
}
