import { equivalentCodes, type CourseId, type CreditRange } from "./course.ts";
import { patternMatches, type CoursePattern, type PatternMatch } from "./coursePatterns.ts";
import { countsCatalogText } from "./catalogTextCounting.ts";
import { constraintProgress, findPart, type ConstraintCap, type ConstraintPart, type ConstraintProgress, type CreditConstraint, type ListedCourse } from "./creditConstraints.ts";

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
  /**
   * C1 (Phase C): the catalog's own explanation of the rule, often the only place credit totals live
   * ("must total 23 credits… 11 must have a CSCI designator"). Shown as written.
   */
  description?: string | null;
  /**
   * C2 (Phase C): credit constraints read from the rule's catalog text or a per-program override.
   * Shown; counted toward progress only for programs in `CATALOG_TEXT_COUNTED` (Hadi, 2026-11-03: once
   * C4 agrees with APAS).
   */
  constraints?: CreditConstraint[];
  /**
   * C3 (Phase C): a subject-and-level pattern ("4xxx/5xxx EE, excluding EE 4981H") read from the catalog
   * text of a leaf rule that lists no courses. Shown; counted like C2 (matching courses join the rule's
   * list for its own and its parents' constraints) only for programs in `CATALOG_TEXT_COUNTED`.
   */
  pattern?: CoursePattern;
}

export interface CoursesRule extends RuleBase {
  kind: "courses";
  choices: CourseChoice[];
  minCourses: number;
  minCredits: number;
}

export interface GroupRule extends RuleBase {
  /** "numberOf" (C1): complete `count` of the children, with at least `totalCourses` courses in all. */
  kind: "anyOf" | "allOf" | "numberOf";
  children: Rule[];
  /** numberOf only: how many children (e.g. EE technical specialty areas) must be completed. */
  count?: number;
  /** numberOf only: courses needed across those children (EE: 5 courses in 4 areas). */
  totalCourses?: number;
}

export interface TextRule extends RuleBase {
  kind: "text";
  text: string;
}

export type Rule = CoursesRule | GroupRule | TextRule;

/**
 * CourseDog's `requirementLevel` (B26): "admission" = courses a college requires before a student can
 * be admitted to the major (CSE, Carlson, Nursing); "subplan" = an optional track (integrated B.S./M.S.).
 * Absent = an ordinary program requirement.
 */
export type RequirementLevel = "program" | "admission" | "subplan";

export interface Requirement {
  id: string;
  name: string;
  notes: string | null;
  rules: Rule[];
  level?: RequirementLevel;
  /** C2: constraints read from the requirement's own notes ("Take 12 credits from the lists below"). Shown only. */
  constraints?: CreditConstraint[];
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
  /** B26: the catalog's own "Program Admission Requirements" text (GPA rules, deadlines), as plain text. */
  admissionNotes?: string | null;
  /** B26: https links in that text (the college's application page, the technical GPA page). */
  admissionLinks?: { label: string; url: string }[];
}

// ---------------------------------------------------------------------------
// Evaluation

export interface PlannedForAudit {
  courseId: CourseId;
  /** Credits counted toward credit minimums (the course's minimum credits). */
  credits: number;
  /** C3: "EE 4111", to match catalog-text patterns. Optional; without it no pattern matches the course. */
  code?: string | null;
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
  /** numberOf only: children covered, each by a different planned course. */
  areas?: number;
  children?: RuleResult[];
  /** C2: planned credits against `rule.constraints`. Changes `satisfied`/`units`/`filled` only when `catalogTextCounted`. */
  constraints?: ConstraintProgress[];
  /** C3: planned courses matching `rule.pattern`. Count toward constraints only when `catalogTextCounted`. */
  patternMatches?: PatternMatch[];
  /** This rule's C2/C3 readings count toward progress (its program is in `CATALOG_TEXT_COUNTED`). */
  catalogTextCounted?: true;
}

export interface RequirementResult {
  requirement: Requirement;
  satisfied: boolean;
  units: number;
  filled: number;
  rules: RuleResult[];
  /** Every planned course that counts toward this requirement. */
  courseIds: CourseId[];
  /** C2: planned credits against `requirement.constraints`. Counted only when `catalogTextCounted`. */
  constraints?: ConstraintProgress[];
  catalogTextCounted?: true;
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

export function evaluateRule(rule: Rule, planned: PlannedForAudit[], count = false): RuleResult {
  const result = evaluateRuleKind(rule, planned, count);
  if (rule.pattern) result.patternMatches = patternMatches(rule.pattern, planned);
  if (count && (rule.pattern || rule.constraints?.length)) result.catalogTextCounted = true;
  if (!rule.constraints?.length) return result;
  const children = rule.kind === "anyOf" || rule.kind === "allOf" || rule.kind === "numberOf" ? rule.children : [];
  const constraints = progressOf(rule.constraints, [rule], children, planned, count);
  return count ? countConstraints({ ...result, constraints }) : { ...result, constraints };
}

/**
 * Counting C2 (Hadi, 2026-11-03): the checkable total, min and dept readings of a rule or requirement are
 * one more unit, filled when all are met, and the rule is satisfied only when they are. A max reading
 * never fails a rule; it caps what its part adds to totals instead. Readings planu.mn can't check
 * ("can't check") add nothing. So counting can only add a check, never mark something met.
 */
function countConstraints<T extends { satisfied: boolean; units: number; filled: number; constraints?: ConstraintProgress[] }>(r: T): T {
  const checked = (r.constraints ?? []).filter((p) => p.constraint.kind !== "max" && p.met != null);
  if (!checked.length) return r;
  const met = checked.every((p) => p.met);
  return { ...r, satisfied: (r.satisfied || r.units === 0) && met, units: r.units + 1, filled: r.filled + (met ? 1 : 0) };
}

/**
 * C2: constraint progress over the courses `rules` list. A constraint that names a part ("from the Core
 * Department Electives") is checked against the rule among `partRoots` and their descendants with that name.
 * Max readings in those rules cap what their part adds (a named part, or the rule that states the cap).
 * When counting, a C3 pattern rule lists the planned courses that match it.
 */
function progressOf(constraints: CreditConstraint[], rules: Rule[], partRoots: Rule[], planned: PlannedForAudit[], count: boolean): ConstraintProgress[] {
  const parts: ConstraintPart[] = [];
  const holders: { rule: Rule; own: boolean }[] = rules.map((rule) => ({ rule, own: true }));
  const visit = (r: Rule) => {
    parts.push({ name: r.name, courseIds: new Set(listedCourses(r, planned, count).map((c) => c.courseId)) });
    if (!rules.includes(r)) holders.push({ rule: r, own: false });
    if (r.kind === "anyOf" || r.kind === "allOf" || r.kind === "numberOf") r.children.forEach(visit);
  };
  partRoots.forEach(visit);
  const caps: ConstraintCap[] = [];
  for (const { rule, own } of holders)
    for (const c of rule.constraints ?? []) {
      if (c.kind !== "max" || (own && !c.scope)) continue;
      const courseIds = c.scope ? findPart(c.scope, parts)?.courseIds : new Set(listedCourses(rule, planned, count).map((l) => l.courseId));
      if (courseIds) caps.push({ courseIds, credits: c.credits });
    }
  return constraintProgress(constraints, rules.flatMap((r) => listedCourses(r, planned, count)), parts, planned, caps);
}

function listedCourses(rule: Rule, planned: PlannedForAudit[], count: boolean): ListedCourse[] {
  const matched = count && rule.pattern ? patternMatches(rule.pattern, planned).map((m) => ({ courseId: m.courseId, code: m.code })) : [];
  if (rule.kind === "courses") {
    return [...rule.choices.flatMap((c) => c.options).flatMap((o) => (o.courseId == null ? [] : [{ courseId: o.courseId, code: o.code }])), ...matched];
  }
  if (rule.kind === "text") return matched;
  return rule.children.flatMap((c) => listedCourses(c, planned, count));
}

function evaluateRuleKind(rule: Rule, planned: PlannedForAudit[], count: boolean): RuleResult {
  switch (rule.kind) {
    case "courses":
      return evaluateCourses(rule, planned);
    case "text":
      return { rule, satisfied: false, units: 0, filled: 0 };
    case "allOf": {
      const children = rule.children.map((c) => evaluateRule(c, planned, count));
      const units = children.reduce((n, c) => n + c.units, 0);
      const satisfied = children.every((c) => c.satisfied || c.units === 0);
      return { rule, satisfied, units, filled: children.reduce((n, c) => n + c.filled, 0), children };
    }
    case "numberOf":
      return evaluateNumberOf(rule, planned, count);
    case "anyOf": {
      const children = rule.children.map((c) => evaluateRule(c, planned, count));
      const required = children.some((c) => c.units > 0);
      const satisfied = children.some((c) => c.satisfied && c.units > 0) || !required;
      return { rule, satisfied, units: required ? 1 : 0, filled: required && satisfied ? 1 : 0, children };
    }
  }
}

/**
 * "Complete N of these" (C1). A course counts toward one child only (EE: "No double dipping among
 * technical specialty areas"), so the children covered are a matching of planned courses to children,
 * the same matching used for choices. The course total counts every planned course any child lists.
 * Children that aren't course lists count when satisfied on their own.
 */
function evaluateNumberOf(rule: GroupRule, planned: PlannedForAudit[], count: boolean): RuleResult {
  const children = rule.children.map((c) => evaluateRule(c, planned, count));
  const lists = rule.children.filter((c): c is CoursesRule => c.kind === "courses");
  const asChoices = lists.map((c) => ({ options: c.choices.flatMap((ch) => ch.options) }));
  const areas =
    matchChoices(asChoices, planned).filter((id) => id != null).length +
    children.filter((c) => c.rule.kind !== "courses" && c.satisfied && c.units > 0).length;
  const listed = new Set(lists.flatMap(listedCourseIds));
  const coursesCount = new Set(planned.map((p) => p.courseId).filter((id) => listed.has(id))).size;
  const needed = rule.count ?? 1;
  const satisfied = areas >= needed && coursesCount >= (rule.totalCourses ?? 0);
  return { rule, satisfied, units: 1, filled: satisfied ? 1 : 0, children, areas, coursesCount };
}

function collectCourseIds(r: RuleResult, out: Set<CourseId>) {
  r.choiceMatches?.forEach((id) => id != null && out.add(id));
  if (r.catalogTextCounted) r.patternMatches?.forEach((m) => out.add(m.courseId));
  r.children?.forEach((c) => collectCourseIds(c, out));
}

export function evaluateRequirement(requirement: Requirement, planned: PlannedForAudit[], count = false): RequirementResult {
  const rules = requirement.rules.map((r) => evaluateRule(r, planned, count));
  const units = rules.reduce((n, r) => n + r.units, 0);
  const ids = new Set<CourseId>();
  rules.forEach((r) => collectCourseIds(r, ids));
  const result: RequirementResult = {
    requirement,
    satisfied: units > 0 && rules.every((r) => r.satisfied || r.units === 0),
    units,
    filled: rules.reduce((n, r) => n + r.filled, 0),
    rules,
    courseIds: [...ids],
  };
  if (!requirement.constraints?.length) return result;
  const constraints = progressOf(requirement.constraints, requirement.rules, requirement.rules, planned, count);
  return count ? { ...countConstraints({ ...result, constraints }), catalogTextCounted: true } : { ...result, constraints };
}

export interface ProgramResult {
  program: Program;
  requirements: RequirementResult[];
  units: number;
  filled: number;
  /** C2/C3 readings counted toward `units`/`filled` (see `EvaluateOptions.catalogText`). */
  catalogTextCounted: boolean;
}

export interface EvaluateOptions {
  /**
   * "count": C2/C3 readings count toward progress; "show": display only. Default: count only for programs
   * in `CATALOG_TEXT_COUNTED`, the ones C4 has checked against a real APAS audit (Hadi, 2026-11-03).
   */
  catalogText?: "count" | "show";
}

/**
 * Evaluate a program. Each requirement is evaluated independently, so one course can count toward
 * several requirements (CourseDog lists e.g. CSCI 3081W in both the core and the writing-intensive
 * requirement). Within one course rule, each planned course fills at most one choice.
 */
export function evaluateProgram(program: Program, planned: PlannedForAudit[], options: EvaluateOptions = {}): ProgramResult {
  const count = options.catalogText ? options.catalogText === "count" : countsCatalogText(program.id);
  const requirements = program.requirements.filter((r) => r.rules.length > 0).map((r) => evaluateRequirement(r, planned, count));
  return {
    program,
    requirements,
    units: requirements.reduce((n, r) => n + r.units, 0),
    filled: requirements.reduce((n, r) => n + r.filled, 0),
    catalogTextCounted: count,
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
