import { equivalentCodes, type CourseId, type CreditRange } from "./course";

/**
 * Program requirements, normalized from UMN's CourseDog catalog (src/server/programs/normalize.ts),
 * and the evaluator that checks a plan against them.
 *
 * Vocabulary (from the 2026 CONTEXT.md): a **program** has **requirements** (CourseDog "ReqGroup"),
 * each made of **rules**. A course rule lists **choices**; a choice is satisfied by any one of its
 * **options** (e.g. "CSCI 1933 or CSCI 1933H").
 */

export interface CourseOption {
  /** CourseDog course group id, e.g. "0036721". */
  groupId: string;
  /** Catalog id when the course is in data/catalog.db; null = can't be planned yet. */
  courseId: CourseId | null;
  code: string | null;
  title: string | null;
  credits: CreditRange | null;
}

export interface CourseChoice {
  options: CourseOption[];
}

interface RuleBase {
  id: string;
  name: string;
  notes: string | null;
}

export interface CoursesRule extends RuleBase {
  kind: "courses";
  choices: CourseChoice[];
  minCourses: number;
  minCredits: number;
}

export interface GroupRule extends RuleBase {
  kind: "anyOf" | "allOf";
  children: Rule[];
}

export interface TextRule extends RuleBase {
  kind: "text";
  text: string;
}

export type Rule = CoursesRule | GroupRule | TextRule;

export interface Requirement {
  id: string;
  name: string;
  notes: string | null;
  rules: Rule[];
}

export interface Program {
  /** CourseDog program group id, stored in `Plan.programs`. */
  id: string;
  name: string;
  /** "Major", "Minor", ... */
  type: string;
  /**
   * B17: the program's page on UMN's sample-plan site (sampleplan.umn.edu), from the catalog's own
   * "sample plan link" field. Absent when the catalog has none. planu.mn doesn't copy the plan itself.
   */
  samplePlanUrl?: string;
  requirements: Requirement[];
}

// ---------------------------------------------------------------------------
// Evaluation

export interface PlannedForAudit {
  courseId: CourseId;
  /** Credits counted toward credit minimums (the course's minimum credits). */
  credits: number;
}

export interface RuleResult {
  rule: Rule;
  satisfied: boolean;
  /** Rules with nothing required (e.g. "up to 22 elective credits") count 0 units. */
  units: number;
  filled: number;
  /** courses rules only */
  coursesCount?: number;
  credits?: number;
  /** courses rules only: for each choice, the planned course satisfying it (or null). */
  choiceMatches?: (CourseId | null)[];
  children?: RuleResult[];
}

export interface RequirementResult {
  requirement: Requirement;
  satisfied: boolean;
  units: number;
  filled: number;
  rules: RuleResult[];
  /** Every planned course that counts toward this requirement. */
  courseIds: CourseId[];
}

/**
 * Assign planned courses to choices (each course fills at most one choice) maximizing first the number
 * of filled choices, then their credits. The sets of courses that can be matched to distinct choices
 * form a transversal matroid, so adding courses greedily by descending credits, each via an augmenting
 * path (Kuhn), yields a maximum matching whose credit total is also maximal.
 */
function matchChoices(choices: CourseChoice[], planned: PlannedForAudit[]): (CourseId | null)[] {
  const choicesOf = new Map<CourseId, number[]>();
  choices.forEach((choice, i) => {
    for (const o of choice.options) {
      if (o.courseId == null) continue;
      const list = choicesOf.get(o.courseId) ?? [];
      if (!list.includes(i)) choicesOf.set(o.courseId, [...list, i]);
    }
  });
  const holder: (CourseId | null)[] = choices.map(() => null); // choice → course
  const tryPlace = (course: CourseId, seen: Set<number>): boolean => {
    for (const choice of choicesOf.get(course) ?? []) {
      if (seen.has(choice)) continue;
      seen.add(choice);
      const current = holder[choice];
      if (current === null || tryPlace(current, seen)) {
        holder[choice] = course;
        return true;
      }
    }
    return false;
  };
  const unique = [...new Map(planned.map((p) => [p.courseId, p])).values()];
  for (const p of unique.sort((a, b) => b.credits - a.credits)) tryPlace(p.courseId, new Set());
  return holder;
}

function evaluateCourses(rule: CoursesRule, planned: PlannedForAudit[]): RuleResult {
  const choiceMatches = matchChoices(rule.choices, planned);
  const used = new Set(choiceMatches.filter((id): id is CourseId => id != null));
  const matched = planned.filter((p) => used.has(p.courseId));
  const coursesCount = matched.length;
  const credits = matched.reduce((sum, p) => sum + p.credits, 0);
  const required = rule.minCourses > 0 || rule.minCredits > 0;
  const satisfied = coursesCount >= rule.minCourses && credits >= rule.minCredits;
  return {
    rule,
    satisfied,
    units: required ? 1 : 0,
    filled: required && satisfied ? 1 : 0,
    coursesCount,
    credits,
    choiceMatches,
  };
}

export function evaluateRule(rule: Rule, planned: PlannedForAudit[]): RuleResult {
  switch (rule.kind) {
    case "courses":
      return evaluateCourses(rule, planned);
    case "text":
      return { rule, satisfied: false, units: 0, filled: 0 };
    case "allOf": {
      const children = rule.children.map((c) => evaluateRule(c, planned));
      const units = children.reduce((n, c) => n + c.units, 0);
      const satisfied = children.every((c) => c.satisfied || c.units === 0);
      return { rule, satisfied, units, filled: children.reduce((n, c) => n + c.filled, 0), children };
    }
    case "anyOf": {
      const children = rule.children.map((c) => evaluateRule(c, planned));
      const required = children.some((c) => c.units > 0);
      const satisfied = children.some((c) => c.satisfied && c.units > 0) || !required;
      return { rule, satisfied, units: required ? 1 : 0, filled: required && satisfied ? 1 : 0, children };
    }
  }
}

function collectCourseIds(r: RuleResult, out: Set<CourseId>) {
  r.choiceMatches?.forEach((id) => id != null && out.add(id));
  r.children?.forEach((c) => collectCourseIds(c, out));
}

export function evaluateRequirement(requirement: Requirement, planned: PlannedForAudit[]): RequirementResult {
  const rules = requirement.rules.map((r) => evaluateRule(r, planned));
  const units = rules.reduce((n, r) => n + r.units, 0);
  const ids = new Set<CourseId>();
  rules.forEach((r) => collectCourseIds(r, ids));
  return {
    requirement,
    satisfied: units > 0 && rules.every((r) => r.satisfied || r.units === 0),
    units,
    filled: rules.reduce((n, r) => n + r.filled, 0),
    rules,
    courseIds: [...ids],
  };
}

export interface ProgramResult {
  program: Program;
  requirements: RequirementResult[];
  units: number;
  filled: number;
}

/**
 * Evaluate a program. Each requirement is evaluated independently, so one course can count toward
 * several requirements (CourseDog lists e.g. CSCI 3081W in both the core and the writing-intensive
 * requirement). Within one course rule, each planned course fills at most one choice.
 */
export function evaluateProgram(program: Program, planned: PlannedForAudit[]): ProgramResult {
  const requirements = program.requirements.filter((r) => r.rules.length > 0).map((r) => evaluateRequirement(r, planned));
  return {
    program,
    requirements,
    units: requirements.reduce((n, r) => n + r.units, 0),
    filled: requirements.reduce((n, r) => n + r.filled, 0),
  };
}

/** Every catalog course id a requirement lists (for filtering and "is this course useful?"). */
export function listedCourseIds(rule: Rule): CourseId[] {
  if (rule.kind === "courses") return rule.choices.flatMap((c) => c.options.flatMap((o) => (o.courseId == null ? [] : [o.courseId])));
  if (rule.kind === "text") return [];
  return rule.children.flatMap(listedCourseIds);
}

/**
 * Every catalog course any of a program's requirements lists (B11). A planned course outside this set
 * for all of a plan's programs is an **elective**: it counts toward no program requirement. Listed,
 * not matched, so a surplus course from a requirement's list (a 4th "pick 3") isn't called an elective.
 */
export function programCourseIds(program: Program): Set<CourseId> {
  return new Set(program.requirements.flatMap((r) => r.rules.flatMap(listedCourseIds)));
}

/** Every course code a program lists, including options not in the catalog (B11 honors fix). */
export function programCourseCodes(program: Program): Set<string> {
  const codes = (rule: Rule): string[] =>
    rule.kind === "courses"
      ? rule.choices.flatMap((c) => c.options.flatMap((o) => (o.code ? [o.code.toUpperCase()] : [])))
      : rule.kind === "text"
        ? []
        : rule.children.flatMap(codes);
  return new Set(program.requirements.flatMap((r) => r.rules.flatMap(codes)));
}

/**
 * Does the program list this course? By catalog id, or by code with honors equivalence ("CSCI 1933H"
 * counts when only "CSCI 1933" is listed). Review fix by Ishaan's Claude on #50.
 */
export function programListsCourse(ids: ReadonlySet<CourseId>, codes: ReadonlySet<string>, courseId: CourseId, code: string | null): boolean {
  if (ids.has(courseId)) return true;
  return code !== null && equivalentCodes(code.toUpperCase()).some((c) => codes.has(c));
}
