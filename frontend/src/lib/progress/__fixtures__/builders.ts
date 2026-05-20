import { ReqGroup, ReqRule, ReqValue } from "@/types/program";
import { PlannedCourse } from "@/types/plan";

/**
 * Test fixture builders. Produce realistic-shaped objects without dragging in
 * the full CourseDog payload. Keep these minimal — fixtures are living docs.
 */

let _ruleCounter = 0;

export function makeCompleteCoursesRule(courseIds: string[], name = "rule"): ReqRule {
  return {
    id: `cc-${++_ruleCounter}`,
    name,
    condition: "completeCourses",
    value: {
      condition: "completeCourses",
      values: [{ value: courseIds }],
    } as any,
  } as ReqRule;
}

export function makeMinimumCoursesRule(
  n: number,
  candidateIds: string[],
  name = "rule"
): ReqRule {
  return {
    id: `mc-${++_ruleCounter}`,
    name,
    condition: "minimumCourses",
    minCourses: n,
    value: {
      condition: "minimumCourses",
      number: n,
      values: [{ value: candidateIds }],
    } as any,
  } as ReqRule;
}

export function makeMinimumCreditsRule(
  floor: number,
  candidateIds: string[],
  name = "rule"
): ReqRule {
  return {
    id: `cr-${++_ruleCounter}`,
    name,
    condition: "minimumCredits",
    minCredits: floor,
    value: {
      condition: "minimumCredits",
      number: floor,
      values: [{ value: candidateIds }],
    } as any,
  } as ReqRule;
}

export function makeReqGroup(name: string, rules: ReqRule[]): ReqGroup {
  return {
    id: `group-${name.toLowerCase().replace(/\s+/g, "-")}`,
    name,
    type: "requirement",
    requirementLevel: "program",
    showInCatalog: true,
    rules,
  };
}

let _courseCounter = 1000;

export function makePlannedCourse(
  id: number | null,
  opts: { dept?: string; num?: string; creditMin?: number; courseGroupId?: string } = {}
): PlannedCourse {
  const realId = id ?? ++_courseCounter;
  return {
    id: realId,
    dept_abbr: opts.dept ?? "CSCI",
    course_num: opts.num ?? "1001",
    campus: "umntc",
    class_desc: "",
    total_students: 0,
    total_grades: "",
    onestop: "",
    onestop_desc: "",
    cred_min: opts.creditMin ?? 3,
    cred_max: opts.creditMin ?? 3,
    srt_vals: "",
    courseGroupId: opts.courseGroupId ?? String(realId),
    lock: "unlocked",
  };
}
