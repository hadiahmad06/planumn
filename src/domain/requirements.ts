import type { CourseId, CreditRange } from "./course";

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
 * Assign planned courses to choices so as many choices as possible are filled (bipartite matching,
 * Kuhn's algorithm), each course used at most once. Candidates are tried highest-credit first, so
 * when several assignments fill the same number of choices the credit total tends to be higher.
 */
function matchChoices(choices: CourseChoice[], planned: PlannedForAudit[]): (CourseId | null)[] {
  const byId = new Map(planned.map((p) => [p.courseId, p]));
  const candidates = choices.map((choice) =>
    [...new Set(choice.options.map((o) => o.courseId).filter((id): id is CourseId => id != null && byId.has(id)))].sort(
      (a, b) => byId.get(b)!.credits - byId.get(a)!.credits,
    ),
  );
  const owner = new Map<CourseId, number>(); // course → choice index
  const tryAssign = (choice: number, seen: Set<CourseId>): boolean => {
    for (const id of candidates[choice]) {
      if (seen.has(id)) continue;
      seen.add(id);
      const current = owner.get(id);
      if (current === undefined || tryAssign(current, seen)) {
        owner.set(id, choice);
        return true;
      }
    }
    return false;
  };
  choices.forEach((_, i) => tryAssign(i, new Set()));
  const matches: (CourseId | null)[] = choices.map(() => null);
  for (const [id, choice] of owner) matches[choice] = id;
  return matches;
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
