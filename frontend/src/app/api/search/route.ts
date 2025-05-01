import { NextResponse } from "next/server";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";

type Course = {
  subject: string;
  number: string;
  title: string;
  credits: number;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase() ?? "";
  const excludeParam = searchParams.get("exclude");
  const excludeCourses: Course[] = excludeParam ? JSON.parse(excludeParam) : [];

  const db = await open({
    filename: path.join(process.cwd(), "public", "CourseInfo.db"),
    driver: sqlite3.Database,
  });

  // Create a list of placeholders for the excluded courses
  const excludePlaceholders = excludeCourses.map(() => "(?, ?)").join(", ");
  const excludeParams = excludeCourses.flatMap(course => [course.subject, course.number]);

  // Check if the query is a course number (e.g., "1133", "CSCI1133", "csc 113")
  const courseNumberMatch = q.match(/(?:[a-z]+\s*)?(\d+)(?:h)?/i);
  const partialNumber = courseNumberMatch ? courseNumberMatch[1] : "";
  const deptMatch = q.match(/^([a-z]+)/i);
  const dept = deptMatch ? deptMatch[1].toUpperCase() : "";

  // If we have a partial number, find the closest matches
  const numberPattern = partialNumber ? `%${partialNumber}%` : `%${q}%`;

  const results = await db.all(
    `SELECT dept, number, title, credits, 
      CASE 
        WHEN LOWER(dept || number) = LOWER(?) THEN 1
        WHEN LOWER(dept || number) = LOWER(?) THEN 2
        WHEN LOWER(dept) = LOWER(?) AND number LIKE ? THEN 3
        WHEN LOWER(dept) = LOWER(?) AND number LIKE ? THEN 4
        WHEN LOWER(dept) LIKE ? AND number LIKE ? THEN 5
        WHEN LOWER(dept) LIKE ? THEN 6
        WHEN LOWER(number) LIKE ? OR LOWER(title) LIKE ? THEN 7
        ELSE 8
      END as priority
     FROM courses
     WHERE (
       (LOWER(dept || number) = LOWER(?) OR LOWER(dept || number) = LOWER(?))
       OR (LOWER(dept) = LOWER(?) AND number LIKE ?)
       OR (LOWER(dept) = LOWER(?) AND number LIKE ?)
       OR (LOWER(dept) LIKE ? AND number LIKE ?)
       OR LOWER(dept) LIKE ?
       OR LOWER(number) LIKE ?
       OR LOWER(title) LIKE ?
     )
     AND (dept, number) NOT IN (${excludePlaceholders || "(NULL, NULL)"})
     ORDER BY priority, dept, number
     LIMIT 100`,
    [
      // Priority calculation parameters
      dept + partialNumber, // Exact match with department
      dept + partialNumber + 'H', // Exact match with department and H
      dept, numberPattern, // Department and partial number
      dept, numberPattern + 'H', // Department and partial number with H
      `%${q}%`, numberPattern, // Department and number like
      `%${q}%`, // Department like
      `%${q}%`, `%${q}%`, // Number or title like
      // WHERE clause parameters
      dept + partialNumber, // Exact match with department
      dept + partialNumber + 'H', // Exact match with department and H
      dept, numberPattern, // Department and partial number
      dept, numberPattern + 'H', // Department and partial number with H
      `%${q}%`, numberPattern, // Department and number like
      `%${q}%`, // Department like
      `%${q}%`, // Number like
      `%${q}%`, // Title like
      ...excludeParams // Excluded courses
    ]
  );

  return NextResponse.json(results);
}