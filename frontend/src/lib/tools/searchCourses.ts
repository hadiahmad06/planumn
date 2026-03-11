import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import type { ChatCompletionTool } from "openai/resources/chat/completions";

const DB_PATH = path.join(process.cwd(), "..", "data", "CourseInfo.db");

export type CourseResult = {
  dept: string;
  number: string;
  title: string;
  credits: number;
};

export const definition: ChatCompletionTool = {
  type: "function",
  function: {
    name: "search_courses",
    description:
      "Search the UMN course catalog by department, course number, or keyword. Returns up to 20 matching courses with their department, number, title, and credits. Use this first to find courses, then call get_course_details for descriptions.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query, e.g. 'CSCI 4041', 'algorithms', 'linear algebra', 'MATH 2xxx'",
        },
      },
      required: ["query"],
    },
  },
};

export async function execute(query: string): Promise<CourseResult[]> {
  const q = query.trim();
  const qLower = q.toLowerCase().replace(/\s+/g, "");
  const like = `%${q}%`;

  const db = await open({ filename: DB_PATH, driver: sqlite3.Database });

  const results = await db.all<CourseResult[]>(
    `SELECT dept, number, title, credits FROM courses
     WHERE
       LOWER(dept || number) = LOWER(?) OR
       LOWER(dept || ' ' || number) = LOWER(?) OR
       (LOWER(dept) = LOWER(?) AND number LIKE ?) OR
       LOWER(dept) LIKE ? OR
       LOWER(number) LIKE ? OR
       LOWER(title) LIKE ?
     ORDER BY
       CASE
         WHEN LOWER(dept || number) = LOWER(?) THEN 1
         WHEN LOWER(dept || ' ' || number) = LOWER(?) THEN 2
         WHEN LOWER(dept) = LOWER(?) AND number LIKE ? THEN 3
         WHEN LOWER(title) LIKE ? THEN 4
         ELSE 5
       END,
       dept, CAST(number AS INTEGER)
     LIMIT 20`,
    [
      qLower, q,
      q.match(/^[a-z]+/i)?.[0] ?? "", `%${q.match(/\d+/)?.[0] ?? q}%`,
      like, like, like,
      qLower, q,
      q.match(/^[a-z]+/i)?.[0] ?? "", `%${q.match(/\d+/)?.[0] ?? q}%`,
      like,
    ]
  );

  await db.close();
  return results;
}
