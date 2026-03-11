import type { ChatCompletionTool } from "openai/resources/chat/completions";
import type { PlanNullable } from "@/types/plan";

import { definition as searchDef, execute as searchExec } from "./searchCourses";
import { definition as detailsDef, execute as detailsExec } from "./getCourseDetails";
import { definition as planInfoDef, execute as planInfoExec } from "./getPlanInfo";
import { definition as prereqDef, execute as prereqExec } from "./checkPrerequisites";

export type CourseName = {
  dept_abbr: string;
  course_num: string;
  cred_min: number;
  cred_max: number;
};

const allDefinitions: ChatCompletionTool[] = [
  searchDef,
  detailsDef,
  planInfoDef,
  prereqDef,
];

/**
 * Creates a tool set bound to the current student's plan.
 * Plan-aware tools (get_plan_info, check_prerequisites) close over
 * plan + courseNames so the route doesn't need to pass them explicitly.
 */
export function createToolSet(
  plan: PlanNullable,
  courseNames: Record<string, CourseName>
) {
  async function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    switch (name) {
      case "search_courses":
        return searchExec(args.query as string);
      case "get_course_details":
        return detailsExec(args.courses as { dept: string; number: string }[]);
      case "get_plan_info":
        return planInfoExec(plan, courseNames, args.semester as string | undefined);
      case "check_prerequisites":
        return prereqExec(
          args.course as string,
          args.target_semester as string,
          plan,
          courseNames
        );
      default:
        return { error: `Unknown tool: ${name}` };
    }
  }

  return { tools: allDefinitions, executeTool };
}
