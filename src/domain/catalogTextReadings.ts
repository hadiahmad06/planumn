import type { ConstraintProgress } from "./creditConstraints.ts";
import type { ProgramResult, RequirementResult, RuleResult } from "./requirements.ts";

/**
 * Hadi, 2026-11-04: "we should count them, but be clear about how many of the requirements are full,
 * maybe put a little warning icon with a number" (Hadi's Claude).
 *
 * A requirement is **full** when its progress comes only from structured CourseDog data. It isn't full
 * when any part of it is a reading of catalog text: a C2 total, min or dept reading or a C3 pattern
 * (these count toward progress), or any reading planu.mn can't check (it adds nothing, so progress is
 * missing a part the catalog states). A max reading that can be checked isn't counted here: it only caps
 * what a part adds to a total, min or dept reading, which is itself counted.
 */

export interface CatalogTextReadings {
  /** Readings inside the requirement that make it not full (counted plus can't-check). 0 = full. */
  count: number;
  /** Of those, the ones planu.mn can't check ("can't check" in the box). */
  cantCheck: number;
}

function add(into: CatalogTextReadings, constraints: ConstraintProgress[] | undefined) {
  for (const p of constraints ?? []) {
    if (p.met == null) {
      into.count++;
      into.cantCheck++;
    } else if (p.constraint.kind !== "max") into.count++;
  }
}

function visit(into: CatalogTextReadings, r: RuleResult) {
  add(into, r.constraints);
  if (r.rule.pattern) into.count++;
  r.children?.forEach((c) => visit(into, c));
}

/** Catalog-text readings inside one requirement: its own notes' constraints and every rule's, at any depth. */
export function catalogTextReadings(result: RequirementResult): CatalogTextReadings {
  const out = { count: 0, cantCheck: 0 };
  add(out, result.constraints);
  result.rules.forEach((r) => visit(out, r));
  return out;
}

/** How many of a program's evaluated requirements aren't full (`notFull` of `total`); requirements, not readings. */
export function requirementsNotFull(result: ProgramResult): { notFull: number; total: number } {
  return { notFull: result.requirements.filter((r) => catalogTextReadings(r).count > 0).length, total: result.requirements.length };
}
