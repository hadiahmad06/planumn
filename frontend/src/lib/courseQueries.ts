import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { CourseDetails, CourseStub } from "@/types/plan";

function openDb() {
  return open({
    filename: path.join(process.cwd(), "public", "ProcessedData.db"),
    driver: sqlite3.Database,
  });
}

export async function searchCourses(query: string, limit = 20): Promise<CourseStub[]> {
  const q = query.toLowerCase().replace(/\s+/g, "");

  const courseNumberMatch = q.match(/(?:[a-z]+\s*)?(\d+)(?:h)?/i);
  const partialNumber = courseNumberMatch ? courseNumberMatch[1] : "";
  const deptMatch = q.match(/^([a-z]+)/i);
  const dept = deptMatch ? deptMatch[1].toUpperCase() : "";

  const numberPattern = partialNumber ? `%${partialNumber}%` : `%${q}%`;

  const db = await openDb();

  const results = await db.all(
    `SELECT DISTINCT id, dept_abbr, course_num,
      CASE
        WHEN LOWER(dept_abbr || course_num) = LOWER(?) THEN 1
        WHEN LOWER(dept_abbr || course_num) = LOWER(?) THEN 2
        WHEN LOWER(dept_abbr) = LOWER(?) AND course_num LIKE ? THEN 3
        WHEN LOWER(dept_abbr) = LOWER(?) AND course_num LIKE ? THEN 4
        WHEN LOWER(dept_abbr) LIKE ? AND course_num LIKE ? THEN 5
        WHEN LOWER(dept_abbr) LIKE ? THEN 6
        WHEN LOWER(course_num) LIKE ? OR LOWER(class_desc) LIKE ? THEN 7
        ELSE 8
      END as priority
     FROM classdistribution
     WHERE (
       (LOWER(dept_abbr || course_num) = LOWER(?) OR LOWER(dept_abbr || course_num) = LOWER(?))
       OR (LOWER(dept_abbr) = LOWER(?) AND course_num LIKE ?)
       OR (LOWER(dept_abbr) = LOWER(?) AND course_num LIKE ?)
       OR (LOWER(dept_abbr) LIKE ? AND course_num LIKE ?)
       OR LOWER(dept_abbr) LIKE ?
       OR LOWER(course_num) LIKE ?
       OR LOWER(class_desc) LIKE ?
     )
     ORDER BY priority, dept_abbr, course_num
     LIMIT ?`,
    [
      dept + partialNumber,
      dept + partialNumber + "H",
      dept, numberPattern,
      dept, numberPattern + "H",
      `%${q}%`, numberPattern,
      `%${q}%`,
      `%${q}%`, `%${q}%`,
      dept + partialNumber,
      dept + partialNumber + "H",
      dept, numberPattern,
      dept, numberPattern + "H",
      `%${q}%`, numberPattern,
      `%${q}%`,
      `%${q}%`,
      `%${q}%`,
      limit,
    ]
  ) as CourseStub[];

  await db.close();
  return results;
}

export async function getCourseDetails(ids: number[]): Promise<CourseDetails[]> {
  if (ids.length === 0) return [];

  const db = await openDb();
  const placeholders = ids.map(() => "?").join(", ");
  const results = await db.all(
    `SELECT id, campus, dept_abbr, course_num, class_desc, total_students, total_grades,
            onestop, onestop_desc, cred_min, cred_max, srt_vals, courseGroupId
     FROM classdistribution WHERE id IN (${placeholders})`,
    ids
  ) as CourseDetails[];

  await db.close();
  return results;
}
