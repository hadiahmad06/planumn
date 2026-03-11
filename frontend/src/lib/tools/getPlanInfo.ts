import type { ChatCompletionTool } from "openai/resources/chat/completions";
import type { PlanNullable } from "@/types/plan";
import type { CourseName } from "./index";

const SEASON: Record<string, string> = { "9": "Fall", "3": "Spring", "5": "Summer" };

export const definition: ChatCompletionTool = {
  type: "function",
  function: {
    name: "get_plan_info",
    description:
      "Retrieve the student's graduation plan — semesters, courses, and credit counts. Call without arguments to get the full plan, or pass a semester label to focus on one semester.",
    parameters: {
      type: "object",
      properties: {
        semester: {
          type: "string",
          description: "Optional semester to filter to, e.g. 'Fall 2026'. Omit for the full plan.",
        },
      },
    },
  },
};

export function execute(
  plan: PlanNullable,
  courseNames: Record<string, CourseName>,
  semester?: string
) {
  const semesters = plan.semesters.map((sem) => {
    const season = SEASON[sem.index[3]] ?? "Unknown";
    const year = parseInt("20" + sem.index.slice(1, 3), 10);
    const label = `${season} ${year}`;
    let credits = 0;
    const courses = sem.courses.map((c) => {
      const info = courseNames[c.id];
      const cr = info
        ? info.cred_min === info.cred_max
          ? info.cred_min
          : `${info.cred_min}-${info.cred_max}`
        : "?";
      credits += info?.cred_min ?? 0;
      return {
        name: info ? `${info.dept_abbr} ${info.course_num}` : `ID:${c.id}`,
        credits: cr,
        lock: c.lock,
      };
    });
    return { label, index: sem.index, courses, totalCredits: credits };
  });

  if (semester) {
    const match = semesters.filter(
      (s) => s.label.toLowerCase() === semester.toLowerCase()
    );
    return { title: plan.title, programs: plan.programs, semesters: match };
  }

  return { title: plan.title, programs: plan.programs, semesters };
}
