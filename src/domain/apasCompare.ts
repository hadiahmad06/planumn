import type { ApasAudit, ApasNeeds, ApasRequirement, ApasStatus } from "./apas.ts";
import { evaluateProgram, type PlannedForAudit, type Program, type ProgramResult, type RuleResult } from "./requirements.ts";

/**
 * Phase C/C4: compare planu.mn's requirement results with APAS's own (Hadi's Claude, 2026-11-03).
 *
 * APAS requirements are paired with CourseDog requirements, or rules inside them, **by name** (the
 * matching rule is in docs/agent/heuristics.md §4). planu.mn is evaluated on the courses the audit has
 * on record only, so a disagreement means the two read the same courses differently, not that the plan
 * holds future courses APAS hasn't seen. Display only: nothing here changes planu.mn's progress.
 *
 * Imports use relative `.ts` paths so `scripts/apas-compare.ts` can run this in plain Node.
 */

/** A planu.mn requirement, or a rule inside one, that an APAS requirement can pair with. */
export interface PlanumnTarget {
  level: "requirement" | "rule";
  /** The CourseDog requirement (for a rule: the requirement it sits in). */
  requirementId: string;
  /** The requirement's id, or the rule's. */
  id: string;
  name: string;
  satisfied: boolean;
  units: number;
  filled: number;
}

/**
 * - agree: APAS complete (or complete with in-progress courses) and planu.mn satisfied, or neither.
 * - disagree: one says done and the other doesn't.
 * - unchecked: planu.mn counts nothing here (a text rule, or "up to N credits"), so it has no answer.
 */
export type ApasVerdict = "agree" | "disagree" | "unchecked";

export interface ApasPair {
  apas: ApasRequirement;
  target: PlanumnTarget;
  /** "exact": same name once normalized; "similar": most words shared (see `nameMatch`). */
  match: "exact" | "similar";
  verdict: ApasVerdict;
}

export interface ApasComparison {
  pairs: ApasPair[];
  /** APAS requirements with no planu.mn counterpart (often Lib Ed or degree-wide rules). */
  apasOnly: ApasRequirement[];
  /** planu.mn requirements that neither paired themselves nor through any of their rules. */
  planumnOnly: { id: string; name: string }[];
  /** APAS entries without a status: section headings and lists such as "Courses That Do Not Earn Credit". */
  ignored: ApasRequirement[];
  disagreements: number;
}

const STOPWORDS = new Set(["a", "an", "and", "or", "the", "of", "for", "in", "to", "requirement", "requirements", "req", "course", "courses"]);

/**
 * Words of a requirement name, normalized: lower case, "&" read as "and", parentheticals ("(up to 22
 * credits)") dropped, punctuation as spaces, filler words ("requirements", "courses", "the") dropped and
 * a plural "s" removed, so "Technical Electives (up to 22 credits)" and "Technical Elective" agree.
 */
export function nameWords(name: string): string[] {
  const words = name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w && !STOPWORDS.has(w))
    .map((w) => (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w));
  return [...new Set(words)].sort();
}

/**
 * How well two names match: 1 = the same words, a score in (0, 1) = "similar" (at least 60% of the
 * words shared, or every word of the shorter name, when it has at least two, found in the longer:
 * "Writing Intensive" ↔ "Upper Division Writing Intensive"), 0 = no match.
 */
export function nameMatch(a: string, b: string): number {
  const x = nameWords(a);
  const y = nameWords(b);
  if (!x.length || !y.length) return 0;
  const shared = x.filter((w) => y.includes(w)).length;
  if (shared === x.length && shared === y.length) return 1;
  const jaccard = shared / (x.length + y.length - shared);
  const contained = shared === Math.min(x.length, y.length) && shared >= 2;
  return jaccard >= 0.6 || contained ? Math.min(jaccard, 0.99) : 0;
}

/** APAS finished it, or will once the courses in progress are done. */
export const apasDone = (status: ApasStatus) => status === "complete" || status === "in-progress";

function verdict(apas: ApasRequirement, target: PlanumnTarget): ApasVerdict {
  if (target.units === 0) return "unchecked";
  return apasDone(apas.status) === target.satisfied ? "agree" : "disagree";
}

function targetsOf(result: ProgramResult): PlanumnTarget[] {
  const out: PlanumnTarget[] = [];
  const visit = (requirementId: string, r: RuleResult) => {
    out.push({ level: "rule", requirementId, id: r.rule.id, name: r.rule.name, satisfied: r.satisfied, units: r.units, filled: r.filled });
    r.children?.forEach((c) => visit(requirementId, c));
  };
  for (const req of result.requirements) {
    const { id, name } = req.requirement;
    out.push({ level: "requirement", requirementId: id, id, name, satisfied: req.satisfied, units: req.units, filled: req.filled });
    req.rules.forEach((r) => visit(id, r));
  }
  return out;
}

/**
 * Pair an audit's requirements with a program's results, one to one. Candidate pairs are taken best
 * first: an exact name before a similar one, a requirement before a rule with the same name, then
 * catalog order. APAS requirements without a status are headings and are left out.
 */
export function compareApas(audit: Pick<ApasAudit, "requirements">, result: ProgramResult): ApasComparison {
  const ignored = audit.requirements.filter((r) => r.status === "none");
  const apas = audit.requirements.filter((r) => r.status !== "none");
  const targets = targetsOf(result);

  const candidates: { a: number; t: number; score: number }[] = [];
  apas.forEach((r, a) =>
    targets.forEach((target, t) => {
      const m = nameMatch(r.title, target.name);
      if (m > 0) candidates.push({ a, t, score: m * 2 + (target.level === "requirement" ? 1 : 0) });
    }),
  );
  candidates.sort((x, y) => y.score - x.score || x.a - y.a || x.t - y.t);

  const pairedApas = new Map<number, number>();
  const pairedTargets = new Set<number>();
  for (const c of candidates) {
    if (pairedApas.has(c.a) || pairedTargets.has(c.t)) continue;
    pairedApas.set(c.a, c.t);
    pairedTargets.add(c.t);
  }

  const pairs: ApasPair[] = [...pairedApas.entries()]
    .sort(([a], [b]) => a - b)
    .map(([a, t]) => ({
      apas: apas[a],
      target: targets[t],
      match: nameMatch(apas[a].title, targets[t].name) === 1 ? "exact" : "similar",
      verdict: verdict(apas[a], targets[t]),
    }));
  const touched = new Set(pairs.map((p) => p.target.requirementId));
  return {
    pairs,
    apasOnly: apas.filter((_, a) => !pairedApas.has(a)),
    planumnOnly: result.requirements.filter((r) => !touched.has(r.requirement.id)).map((r) => ({ id: r.requirement.id, name: r.requirement.name })),
    ignored,
    disagreements: pairs.filter((p) => p.verdict === "disagree").length,
  };
}

const normCode = (code: string) => code.trim().toUpperCase().replace(/\s+/g, " ");

/**
 * Course codes the audit has on record: credit earned (UMN, exam or transfer), in progress, or
 * registered for a future term. Withdrawn, failed and no-credit rows are left out, as APAS leaves them.
 */
export function apasRecordCodes(audit: Pick<ApasAudit, "courses">): Set<string> {
  return new Set(audit.courses.filter((c) => c.earnedCredit || c.kind === "in-progress" || c.kind === "planned").map((c) => normCode(c.code)));
}

/** The planned courses the audit also has on record, matched by code. Courses without a code drop out. */
export function plannedOnRecord(planned: PlannedForAudit[], audit: Pick<ApasAudit, "courses">): PlannedForAudit[] {
  const codes = apasRecordCodes(audit);
  return planned.filter((p) => p.code != null && codes.has(normCode(p.code)));
}

/** Evaluate `program` on the audit's courses only, then compare. */
export function compareApasProgram(audit: Pick<ApasAudit, "requirements" | "courses">, program: Program, planned: PlannedForAudit[]): ApasComparison {
  return compareApas(audit, evaluateProgram(program, plannedOnRecord(planned, audit)));
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** "10 credits, 2 sub-requirements", or "" when APAS lists nothing still needed. */
export function describeApasNeeds(needs: ApasNeeds | null): string {
  if (!needs) return "";
  return [
    needs.credits != null && plural(needs.credits, "credit"),
    needs.courses != null && plural(needs.courses, "course"),
    needs.groups != null && plural(needs.groups, "group"),
    needs.subrequirements != null && plural(needs.subrequirements, "sub-requirement"),
  ]
    .filter(Boolean)
    .join(", ");
}

/** APAS's verdict in words: "complete", "complete with courses in progress", "not complete, needs 3 credits". */
export function describeApasStatus(r: ApasRequirement): string {
  if (r.status === "complete") return "complete";
  if (r.status === "in-progress") return "complete with courses in progress";
  if (r.status === "none") return "no status";
  const needs = describeApasNeeds(r.needs);
  const open = r.subrequirements.filter((s) => s.status === "incomplete");
  const sub = !needs && open.length ? open.map((s) => describeApasNeeds(s.needs)).filter(Boolean).join("; ") : "";
  return needs || sub ? `not complete, needs ${needs || sub}` : "not complete";
}

/** Look-ups for the rail: pairs by requirement id, and rule pairs by requirement id, then rule id. */
export function apasPairIndex(comparison: ApasComparison): { requirements: Map<string, ApasPair>; rules: Map<string, Map<string, ApasPair>> } {
  const requirements = new Map<string, ApasPair>();
  const rules = new Map<string, Map<string, ApasPair>>();
  for (const p of comparison.pairs) {
    if (p.target.level === "requirement") requirements.set(p.target.id, p);
    else rules.set(p.target.requirementId, (rules.get(p.target.requirementId) ?? new Map()).set(p.target.id, p));
  }
  return { requirements, rules };
}
