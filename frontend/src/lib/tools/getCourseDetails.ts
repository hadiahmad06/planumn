import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import type { ChatCompletionTool } from "openai/resources/chat/completions";

const DB_PATH = path.join(process.cwd(), "..", "data", "CourseInfo.db");

export type CourseDetail = {
  dept: string;
  number: string;
  title: string;
  credits: number;
  description: string;
};

export const definition: ChatCompletionTool = {
  type: "function",
  function: {
    name: "get_course_details",
    description:
      "Fetch full details (title, credits, and description) for specific UMN courses by department and course number. Use after search_courses to get descriptions and prerequisite information.",
    parameters: {
      type: "object",
      properties: {
        courses: {
          type: "array",
          items: {
            type: "object",
            properties: {
              dept: { type: "string", description: "Department abbreviation, e.g. 'CSCI'" },
              number: { type: "string", description: "Course number, e.g. '4041'" },
            },
            required: ["dept", "number"],
          },
          description: "List of courses to look up",
        },
      },
      required: ["courses"],
    },
  },
};

export async function execute(courses: { dept: string; number: string }[]): Promise<CourseDetail[]> {
  if (courses.length === 0) return [];

  const db = await open({ filename: DB_PATH, driver: sqlite3.Database });

  const placeholders = courses.map(() => "(dept = ? AND number = ?)").join(" OR ");
  const params = courses.flatMap((c) => [c.dept.toUpperCase(), c.number]);

  const results = await db.all<CourseDetail[]>(
    `SELECT dept, number, title, credits, description FROM courses WHERE ${placeholders}`,
    params
  );

  await db.close();
  return results;
}
