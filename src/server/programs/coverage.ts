import { collectGroupIds, htmlToText, normalizeProgram, type RawGroup, type RawProgram, type RawRule } from "./normalize.ts";
import type { Rule } from "@/domain/requirements";

/**
 * Phase C/C0 (Hadi's Claude): how much of a CourseDog program planu.mn's normalizer understands.
 * Used by `scripts/requirement-coverage.ts` to write `docs/agent/requirement-coverage.md`; the
 * baseline that C2–C4 are measured against. Pure: course-id lookups are passed in.
 */

/** Rule conditions `normalizeRule` has a case for. Anything else falls into its generic default. */
export const HANDLED_CONDITIONS = new Set([
  "allOf",
  "anyOf",
  "freeformText",
  "completeCourses",
  "minimumCourses",
  "minimumCredits",
  "completeVariableCoursesAndVariableCredits",
  "numberOf", // C1 (#79)
  "completedAllOf", // C2
  "completedAnyOf",
  "completedAtLeastXOf",
]);

/** Fields C1/C2 read that `RawRule` doesn't declare yet. */
type CoverageRule = RawRule & { description?: string; subRules?: CoverageRule[] };

/** Where a course group id resolves. "old" = only as another course's `deprecatedCourseGroupId` (C1c). */
export type IdStatus = "catalog" | "coursedog" | "old" | "unresolved";

/**
 * "23 credits", "12-16 credits", "34 total credits", "4 cr". Prose numbers next to "credit" are the only credit totals
 * for most programs' elective pools (33-program survey, 2026-10-27).
 */
const CREDIT_PHRASE = /\b(\d{1,2}(?:\.\d)?)(?:\s*(?:-|–|to)\s*\d{1,2})?\s*(?:total\s+)?(?:credits?|cr\b)/gi;

export function creditPhrases(text: string | null): string[] {
  return [...(text ?? "").matchAll(CREDIT_PHRASE)].map((m) => m[0].replace(/\s+/g, " "));
}

export interface RuleFinding {
  requirement: string;
  rule: string;
  detail: string;
}

export interface ProgramCoverage {
  id: string;
  name: string;
  rules: number;
  /** Condition → count, every condition seen. */
  conditions: Record<string, number>;
  unhandled: RuleFinding[];
  freeform: RuleFinding[];
  /** Credit counts that appear only in `description`/`notes`, with no `minCredits`/`maxCredits`/`credits`. */
  proseOnlyCredits: RuleFinding[];
  /** Normalized course rules with no options at all (data dropped somewhere). */
  emptyCourseRules: RuleFinding[];
  /** C2: normalized rules and requirements carrying credit constraints read from text (shown, not counted). */
  readConstraints: number;
  ids: Record<IdStatus, number>;
  unresolvedIds: string[];
}

const hasStructuredCredits = (r: RawRule) => [r.minCredits, r.maxCredits, r.credits].some((n) => typeof n === "number" && n > 0);
const ruleName = (r: { name?: string }) => (r.name ?? "").trim() || "(unnamed rule)";
const clip = (s: string, n = 140) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export function analyzeProgram(raw: RawProgram, idStatus: (groupId: string) => IdStatus): ProgramCoverage {
  const out: ProgramCoverage = {
    id: raw.programGroupId ?? "",
    name: raw.catalogDisplayName ?? raw.name ?? "Program",
    rules: 0,
    conditions: {},
    unhandled: [],
    freeform: [],
    proseOnlyCredits: [],
    emptyCourseRules: [],
    readConstraints: 0,
    ids: { catalog: 0, coursedog: 0, old: 0, unresolved: 0 },
    unresolvedIds: [],
  };
  const groups: RawGroup[] = Object.values(raw.requisites ?? {}).flat();

  const visit = (r: CoverageRule, requirement: string) => {
    out.rules++;
    const condition = r.condition ?? "(none)";
    out.conditions[condition] = (out.conditions[condition] ?? 0) + 1;
    const at = { requirement, rule: ruleName(r) };
    if (!HANDLED_CONDITIONS.has(condition)) out.unhandled.push({ ...at, detail: condition });
    if (condition === "freeformText") {
      out.freeform.push({ ...at, detail: clip(htmlToText(typeof r.value === "string" ? r.value : r.description) ?? "") });
    }
    if (!hasStructuredCredits(r)) {
      const phrases = creditPhrases([htmlToText(r.description), htmlToText(r.notes)].join("\n"));
      if (phrases.length) out.proseOnlyCredits.push({ ...at, detail: [...new Set(phrases)].join("; ") });
    }
    r.subRules?.forEach((s) => visit(s, requirement));
  };
  for (const g of groups) {
    const requirement = (g.name ?? "").trim() || "(unnamed requirement)";
    (g.rules ?? []).forEach((r) => visit(r, requirement));
    // Group notes sometimes carry the total ("Take 12 credits from the lists below").
    const groupPhrases = creditPhrases(htmlToText(g.notes));
    if (groupPhrases.length && !(g.rules ?? []).some(hasStructuredCredits)) {
      out.proseOnlyCredits.push({ requirement, rule: "(requirement notes)", detail: [...new Set(groupPhrases)].join("; ") });
    }
  }

  for (const id of collectGroupIds(raw)) {
    const status = idStatus(id);
    out.ids[status]++;
    if (status === "unresolved") out.unresolvedIds.push(id);
  }

  const program = normalizeProgram(raw, (groupId) => ({ groupId, courseId: null, code: null, title: null, credits: null }));
  const visitNormalized = (rule: Rule, requirement: string) => {
    if (rule.constraints?.length) out.readConstraints++;
    if (rule.kind === "courses" && rule.choices.every((c) => c.options.length === 0)) {
      out.emptyCourseRules.push({ requirement, rule: rule.name, detail: `${rule.minCourses} courses / ${rule.minCredits} credits` });
    }
    if (rule.kind === "anyOf" || rule.kind === "allOf") rule.children.forEach((c) => visitNormalized(c, requirement));
  };
  for (const req of program.requirements) {
    if (req.constraints?.length) out.readConstraints++;
    req.rules.forEach((r) => visitNormalized(r, req.name));
  }
  return out;
}
