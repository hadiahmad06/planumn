import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import type { ChatCompletionTool } from "openai/resources/chat/completions";
import type { PlanNullable } from "@/types/plan";
import type { CourseName } from "./index";

const DB_PATH = path.join(process.cwd(), "..", "data", "CourseInfo.db");
const SEASON: Record<string, string> = { "9": "Fall", "3": "Spring", "5": "Summer" };
// Spring < Summer < Fall within the same year
const SEASON_ORDER: Record<string, number> = { "3": 1, "5": 2, "9": 3 };

export const definition: ChatCompletionTool = {
  type: "function",
  function: {
    name: "check_prerequisites",
    description:
      "Validate whether the prerequisites for a course are satisfied in the student's plan. Returns each prerequisite course and whether it appears in a semester before the target semester.",
    parameters: {
      type: "object",
      properties: {
        course: {
          type: "string",
          description: "Course code to check, e.g. 'CSCI 4041'",
        },
        target_semester: {
          type: "string",
          description: "Semester the student intends to take this course, e.g. 'Fall 2027'",
        },
      },
      required: ["course", "target_semester"],
    },
  },
};

/** Convert a semester index like "1263" to a numeric sort key. */
function sortKey(index: string): number {
  const year = parseInt("20" + index.slice(1, 3), 10);
  return year * 10 + (SEASON_ORDER[index[3]] ?? 0);
}

/** Extract explicit course codes from a prereq description string. */
function parsePrereqs(description: string): string[] {
  const match = description.match(/prereq\s*:\s*(.+)/i);
  if (!match) return [];

  const codes: string[] = [];
  const re = /\b([A-Z]{2,6})\s+(\d{4}[A-Z]*)\b/g;
  let m;
  while ((m = re.exec(match[1])) !== null) {
    codes.push(`${m[1]} ${m[2]}`);
  }
  return [...new Set(codes)];
}

export async function execute(
  course: string,
  targetSemester: string,
  plan: PlanNullable,
  courseNames: Record<string, CourseName>
) {
  // Parse "CSCI 4041" → dept + number
  const parts = course.trim().toUpperCase().split(/\s+/);
  if (parts.length < 2) return { error: `Invalid course format: "${course}"` };
  const [dept, number] = [parts[0], parts[1]];

  // 1. Look up the course description
  const db = await open({ filename: DB_PATH, driver: sqlite3.Database });
  const row = await db.get<{ description: string }>(
    "SELECT description FROM courses WHERE UPPER(dept) = ? AND number = ?",
    [dept, number]
  );
  await db.close();

  if (!row) return { error: `Course ${dept} ${number} not found in catalog` };

  // 2. Parse prerequisites from description
  const prereqs = parsePrereqs(row.description);
  if (prereqs.length === 0) {
    return {
      course,
      target_semester: targetSemester,
      prerequisites: [],
      all_satisfied: true,
      note: "No explicit prerequisites found in course description.",
    };
  }

  // 3. Find the sort key for the target semester
  const targetIndex = plan.semesters.find((sem) => {
    const season = SEASON[sem.index[3]] ?? "Unknown";
    const year = parseInt("20" + sem.index.slice(1, 3), 10);
    return `${season} ${year}`.toLowerCase() === targetSemester.toLowerCase();
  })?.index;

  const targetKey = targetIndex ? sortKey(targetIndex) : Infinity;

  // 4. Build lookup of courses completed in semesters BEFORE the target
  const completedBySemester: Record<string, string[]> = {};
  for (const sem of plan.semesters) {
    if (sortKey(sem.index) >= targetKey) continue;
    const season = SEASON[sem.index[3]] ?? "Unknown";
    const year = parseInt("20" + sem.index.slice(1, 3), 10);
    const label = `${season} ${year}`;
    completedBySemester[label] = sem.courses
      .map((c) => courseNames[c.id])
      .filter(Boolean)
      .map((info) => `${info.dept_abbr} ${info.course_num}`);
  }

  // 5. Check each prerequisite
  const checks = prereqs.map((prereq) => {
    let foundIn: string | null = null;
    for (const [semLabel, courses] of Object.entries(completedBySemester)) {
      if (courses.includes(prereq)) { foundIn = semLabel; break; }
    }
    return { prerequisite: prereq, satisfied: foundIn !== null, found_in_semester: foundIn };
  });

  return {
    course,
    target_semester: targetSemester,
    prerequisites: checks,
    all_satisfied: checks.every((c) => c.satisfied),
  };
}
