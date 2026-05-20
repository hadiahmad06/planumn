import { ReqGroup, ReqRule, ReqValue } from "@/types/program";
import { PlannedCourse } from "@/types/plan";

export type SatisfactionKind = "listing" | "pattern";

export interface Satisfaction {
  courseId: number;
  kind: SatisfactionKind;
  /** The raw leaf value matched (course code or pattern marker). */
  leafValue: string;
}

export interface RuleProgress {
  rule: ReqRule;
  slots: number;
  slotsFilled: number;
  /**
   * Courses contributing to filled slots, capped at `slots`.
   * For minimumCredits rules this is empty if the floor is not met,
   * or contains every matching planned course if it is.
   */
  satisfactions: Satisfaction[];
  /** Every planned course matching a leaf (uncapped). Used for rail row checks. */
  matchedSatisfactions: Satisfaction[];
}

export type RenderMode = "clean" | "structured";

export interface RequirementProgress {
  name: string;
  group: ReqGroup;
  renderMode: RenderMode;
  ruleProgress: RuleProgress[];
}

export interface EvaluatorOptions {
  /** Returns true if a leaf string is a pattern (not an enumerated ID). */
  isPatternLeaf?: (leaf: string) => boolean;
  /** Returns true if a planned course is matched by the given pattern leaf. */
  matchesPattern?: (course: PlannedCourse, leaf: string) => boolean;
  /** Returns true if a planned course matches the given enumerated ID leaf. */
  matchesId?: (course: PlannedCourse, leaf: string) => boolean;
}

const defaultIsPatternLeaf = (leaf: string) => !/^\d+$/.test(leaf);
const defaultMatchesId = (course: PlannedCourse, leaf: string) =>
  String(course.id) === leaf || course.courseGroupId === leaf;
const defaultMatchesPattern = (_course: PlannedCourse, _leaf: string) => false;

/** Walk the values of a single ReqValue/ReqCondition tree, collecting leaf strings. */
function collectLeaves(value: ReqValue | undefined): string[] {
  if (!value) return [];
  const out: string[] = [];
  const visit = (v: any) => {
    if (!v) return;
    if (Array.isArray(v.values)) {
      for (const vv of v.values) visit(vv);
    }
    if (Array.isArray(v.value)) {
      for (const s of v.value) {
        if (typeof s === "string") out.push(s);
      }
    } else if (typeof v.value === "string") {
      out.push(v.value);
    }
    if (Array.isArray(v.subSelections)) {
      for (const sub of v.subSelections) visit(sub);
    }
  };
  visit(value);
  return out;
}

function leafCreditValue(
  course: PlannedCourse | undefined
): number {
  if (!course) return 0;
  return typeof course.cred_min === "number" ? course.cred_min : 0;
}

function slotsForRule(rule: ReqRule, leafCount: number): number {
  switch (rule.condition) {
    case "completeCourses":
      return leafCount;
    case "minimumCourses":
      return (
        rule.minCourses ??
        rule.courses ??
        (rule.value as any)?.number ??
        0
      );
    case "minimumCredits":
      return 1;
    default:
      return 0;
  }
}

function evaluateRule(
  rule: ReqRule,
  planned: PlannedCourse[],
  opts: Required<EvaluatorOptions>
): RuleProgress {
  const leaves = collectLeaves(rule.value as any);
  const slots = slotsForRule(rule, leaves.length);

  const matched: Satisfaction[] = [];
  const seenCourseLeafPairs = new Set<string>();

  for (const leaf of leaves) {
    const isPattern = opts.isPatternLeaf(leaf);
    for (const course of planned) {
      const hits = isPattern
        ? opts.matchesPattern(course, leaf)
        : opts.matchesId(course, leaf);
      if (!hits) continue;
      const key = `${course.id}|${leaf}`;
      if (seenCourseLeafPairs.has(key)) continue;
      seenCourseLeafPairs.add(key);
      matched.push({
        courseId: course.id,
        kind: isPattern ? "pattern" : "listing",
        leafValue: leaf,
      });
    }
  }

  let slotsFilled = 0;
  let satisfactions: Satisfaction[] = [];

  if (rule.condition === "minimumCredits") {
    const floor =
      rule.minCredits ??
      rule.credits ??
      (rule.value as any)?.number ??
      0;
    // Sum credits of distinct planned courses that matched at least one leaf.
    const matchedIds = new Set(matched.map((m) => m.courseId));
    const credits = planned
      .filter((c) => matchedIds.has(c.id))
      .reduce((sum, c) => sum + leafCreditValue(c), 0);
    if (credits >= floor && floor > 0) {
      slotsFilled = 1;
      satisfactions = matched;
    } else {
      slotsFilled = 0;
      satisfactions = [];
    }
  } else if (rule.condition === "completeCourses") {
    // One slot per listed leaf; filled when that leaf matched any planned course.
    // Each leaf can contribute at most 1.
    const filledLeaves = new Set(matched.map((m) => m.leafValue));
    slotsFilled = filledLeaves.size;
    // Contributors: one per filled leaf (first matching course per leaf).
    const seenLeaves = new Set<string>();
    satisfactions = [];
    for (const sat of matched) {
      if (seenLeaves.has(sat.leafValue)) continue;
      seenLeaves.add(sat.leafValue);
      satisfactions.push(sat);
    }
  } else if (rule.condition === "minimumCourses") {
    // Up to `slots` distinct planned courses contribute.
    const seenCourses = new Set<number>();
    satisfactions = [];
    for (const sat of matched) {
      if (seenCourses.has(sat.courseId)) continue;
      seenCourses.add(sat.courseId);
      satisfactions.push(sat);
      if (satisfactions.length >= slots) break;
    }
    slotsFilled = satisfactions.length;
  }

  return {
    rule,
    slots,
    slotsFilled,
    satisfactions,
    matchedSatisfactions: matched,
  };
}

function determineRenderMode(
  group: ReqGroup,
  opts: Required<EvaluatorOptions>
): RenderMode {
  for (const rule of group.rules) {
    if (rule.condition !== "completeCourses") return "structured";
    if (Array.isArray(rule.subRules) && rule.subRules.length > 0)
      return "structured";
    const leaves = collectLeaves(rule.value as any);
    if (leaves.length === 0) return "structured";
    if (leaves.some((l) => opts.isPatternLeaf(l))) return "structured";
  }
  return "clean";
}

export function evaluateRequirements(
  groups: ReqGroup[],
  planned: PlannedCourse[],
  options: EvaluatorOptions = {}
): RequirementProgress[] {
  const opts: Required<EvaluatorOptions> = {
    isPatternLeaf: options.isPatternLeaf ?? defaultIsPatternLeaf,
    matchesPattern: options.matchesPattern ?? defaultMatchesPattern,
    matchesId: options.matchesId ?? defaultMatchesId,
  };

  return groups.map((group) => ({
    name: group.name,
    group,
    renderMode: determineRenderMode(group, opts),
    ruleProgress: group.rules.map((rule) => evaluateRule(rule, planned, opts)),
  }));
}
