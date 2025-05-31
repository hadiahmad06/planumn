import { NextResponse } from "next/server";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { Course } from "@/types/plan";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase().replace(/\s+/g, "") ?? "";
  const excludeParam = searchParams.get("exclude");
  const excludeCourses: number[] = excludeParam ? JSON.parse(excludeParam) : [];

  const db = await open({
    filename: path.join(process.cwd(), "public", "ProcessedData.db"),
    driver: sqlite3.Database,
  });

  const courseNumberMatch = q.match(/(?:[a-z]+\s*)?(\d+)(?:h)?/i);
  const partialNumber = courseNumberMatch ? courseNumberMatch[1] : "";
  const deptMatch = q.match(/^([a-z]+)/i);
  const dept = deptMatch ? deptMatch[1].toUpperCase() : "";

  const numberPattern = partialNumber ? `%${partialNumber}%` : `%${q}%`;

  const results = await db.all(
    `SELECT DISTINCT id, campus, dept_abbr, course_num, class_desc, total_students, total_grades, onestop, onestop_desc, cred_min, cred_max, srt_vals,
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
     AND id NOT IN (${excludeCourses.map(() => "?").join(", ") || "NULL"})
     ORDER BY priority, dept_abbr, course_num
     LIMIT 100`,
    [
      dept + partialNumber,
      dept + partialNumber + 'H',
      dept, numberPattern,
      dept, numberPattern + 'H',
      `%${q}%`, numberPattern,
      `%${q}%`,
      `%${q}%`, `%${q}%`,
      dept + partialNumber,
      dept + partialNumber + 'H',
      dept, numberPattern,
      dept, numberPattern + 'H',
      `%${q}%`, numberPattern,
      `%${q}%`,
      `%${q}%`,
      `%${q}%`,
      ...excludeCourses
    ]
  );

  // console.log("Excluding courses:", excludeCourses);
  // console.log("First 10 results:", results);

  return NextResponse.json(results);
}