import type { CreditConstraint } from "@/domain/creditConstraints";

/**
 * Phase C/C2 (Hadi's Claude): hand-entered credit constraints for rules whose catalog text the phrase
 * patterns in `src/domain/creditConstraints.ts` misread. Keyed by CourseDog program group id, then rule
 * id. An entry **replaces** what was read from that rule's text; `[]` hides a wrong reading. Each entry
 * needs a `sentence` saying where the number comes from, and a row in docs/agent/heuristics.md.
 *
 * Empty for now: rerun `node scripts/requirement-coverage.ts` and add entries as misreadings turn up.
 */
export type CreditOverride = Omit<CreditConstraint, "source">;

export const CREDIT_OVERRIDES: Record<string, Record<string, CreditOverride[]>> = {};
