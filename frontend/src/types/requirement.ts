import { cached } from "sqlite3";
import { CourseDetails, PlanNullable, Semester } from "./plan";
import { ReqGroup, ReqRule, ReqValue, ReqCondition } from "./program";

export type CompletionStatus = {
  completed: boolean;
  completionPercentage: number;
  completedCourses: string[];
  missingCourses: string[];
  requiredCourses: number;
  requiredCredits: number;
  earnedCourses: number;
  earnedCredits: number;
};

export type RequirementWithCompletion = {
  completionStatus?: CompletionStatus;
};

function extractPlannedCourseCodes(plan: PlanNullable | null, cachedCourses: Record<string, CourseDetails>): Set<string> {
  if (!plan || !plan.semesters) return new Set();

  const courseCodes = new Set<string>();
  for (const semester of plan.semesters) {
    for (const course of semester.courses) {
      const courseData = cachedCourses[course.id] || null
      if (courseData && courseData.dept_abbr && courseData.course_num) {
        courseCodes.add(`${courseData.dept_abbr} ${courseData.course_num}`);
      }
    }
  }
  return courseCodes;
}

function extractCourseCodesFromReqValue(val: ReqValue): string[] {
  if (!val.value || !Array.isArray(val.value)) return [];
  return val.value.map(code => code.trim());
}

function extractCourseCodesFromReqCondition(condition: ReqCondition): string[] {
  const codes: string[] = [];

  if (condition.values && Array.isArray(condition.values)) {
    for (const val of condition.values) {
      codes.push(...extractCourseCodesFromReqValue(val as ReqValue));
    }
  }

  if (condition.subSelections && Array.isArray(condition.subSelections)) {
    for (const sub of condition.subSelections) {
      codes.push(...extractCourseCodesFromReqCondition(sub));
    }
  }

  return codes;
}

function extractCourseCodesFromReqRule(rule: ReqRule): string[] {
  const codes: string[] = [];

  if (rule.value) {
    codes.push(...extractCourseCodesFromReqCondition(rule.value));
  }

  if (rule.subRules && Array.isArray(rule.subRules)) {
    for (const subRule of rule.subRules) {
      codes.push(...extractCourseCodesFromReqRule(subRule));
    }
  }

  return codes;
}

function extractCourseCodesFromReqGroup(reqGroup: ReqGroup): string[] {
  const codes: string[] = [];

  for (const rule of reqGroup.rules) {
    codes.push(...extractCourseCodesFromReqRule(rule));
  }

  return [...new Set(codes)];
}

function calculateCredits(courseCodes: string[], plan: PlanNullable | null, cachedCourses: Record<string, CourseDetails>): number {
  if (!plan || !plan.semesters) return 0;

  let totalCredits = 0;
  const plannedCourses = extractPlannedCourseCodes(plan, cachedCourses);

  for (const code of courseCodes) {
    if (plannedCourses.has(code)) {
      for (const semester of plan.semesters) {
        for (const course of semester.courses) {
          const courseData = cachedCourses[course.id];
          const courseCode = `${courseData.dept_abbr} ${courseData.course_num}`;
          if (courseCode === code) {
            totalCredits += courseData.cred_min || 0;
            break;
          }
        }
      }
    }
  }

  return totalCredits;
}

function checkRequirementCompletion(reqGroup: ReqGroup, plan: PlanNullable | null, cachedCourses: Record<string, CourseDetails>): CompletionStatus {
  const requiredCourseCodes = extractCourseCodesFromReqGroup(reqGroup);
  const plannedCourseCodes = extractPlannedCourseCodes(plan, cachedCourses);

  const completedCourses: string[] = [];
  const missingCourses: string[] = [];

  for (const code of requiredCourseCodes) {
    if (plannedCourseCodes.has(code)) {
      completedCourses.push(code);
    } else {
      missingCourses.push(code);
    }
  }

  const requiredCourses = requiredCourseCodes.length;
  const earnedCourses = completedCourses.length;

  let requiredCredits = 0;
  let earnedCredits = 0;

  for (const rule of reqGroup.rules) {
    if (rule.minCredits !== undefined) {
      requiredCredits = Math.max(requiredCredits, rule.minCredits);
    }
    if (rule.credits !== undefined) {
      requiredCredits = Math.max(requiredCredits, rule.credits);
    }
  }

  earnedCredits = calculateCredits(requiredCourseCodes, plan, cachedCourses);

  let completed = false;
  let completionPercentage = 0;

  if (requiredCourses > 0) {
    completionPercentage = (earnedCourses / requiredCourses) * 100;
  } else if (requiredCredits > 0) {
    completionPercentage = (earnedCredits / requiredCredits) * 100;
  }

  if (completionPercentage >= 100) {
    completed = true;
  }

  return {
    completed,
    completionPercentage: Math.min(completionPercentage, 100),
    completedCourses,
    missingCourses,
    requiredCourses,
    requiredCredits,
    earnedCourses,
    earnedCredits,
  };
}

export function calculateAllRequirementsCompletion(
  reqGroups: Record<string, ReqGroup[]>,
  plan: PlanNullable | null,
  cachedCourses: Record<string, CourseDetails>
): Record<string, CompletionStatus> {
  const completionStatus: Record<string, CompletionStatus> = {};

  for (const [key, groups] of Object.entries(reqGroups)) {
    for (const group of groups) {
      completionStatus[group.id] = checkRequirementCompletion(group, plan, cachedCourses);
    }
  }

  return completionStatus;
}

export type CourseAlternativeGroup = {
  groupId: string;
  courses: string[];
  logic: 'AND' | 'OR';
  satisfied: boolean;
  plannedCourse: string | null;
};

export function findCourseAlternatives(reqGroup: ReqGroup, plan: PlanNullable | null, cachedCourses: Record<string, CourseDetails>): CourseAlternativeGroup[] {
  const alternativeGroups: CourseAlternativeGroup[] = [];
  const plannedCourses = extractPlannedCourseCodes(plan, cachedCourses);
  let groupIdCounter = 0;

  function traverseReqCondition(condition: ReqCondition): void {
    if (!condition || !condition.values) return;

    for (const val of condition.values) {
      if (typeof val === 'object' && 'value' in val && Array.isArray(val.value) && val.value.length > 1) {
        const logic = ('logic' in val && (val.logic === 'AND' || val.logic === 'OR')) ? val.logic : 'OR';
        const courses = val.value.filter((v: any) => typeof v === 'string');
        
        if (courses.length > 1) {
          const plannedCourse = courses.find((c: string) => plannedCourses.has(c)) || null;
          const satisfied = logic === 'OR' ? plannedCourse !== null : courses.every((c: string) => plannedCourses.has(c));

          alternativeGroups.push({
            groupId: `alt-${groupIdCounter++}`,
            courses,
            logic,
            satisfied,
            plannedCourse,
          });
        }
      }

      if ('subSelections' in val && Array.isArray(val.subSelections)) {
        for (const sub of val.subSelections) {
          traverseReqCondition(sub);
        }
      }
    }
  }

  function traverseReqRule(rule: ReqRule): void {
    if (rule.value) {
      traverseReqCondition(rule.value);
    }

    if (rule.subRules && Array.isArray(rule.subRules)) {
      for (const subRule of rule.subRules) {
        traverseReqRule(subRule);
      }
    }
  }

  for (const rule of reqGroup.rules) {
    traverseReqRule(rule);
  }

  return alternativeGroups;
}