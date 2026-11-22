"use client";

import { useMemo } from "react";
import type { ApasAudit } from "@/domain/apas";
import { compareApasProgram, type ApasComparison } from "@/domain/apasCompare";
import type { PlannedForAudit, ProgramResult } from "@/domain/requirements";
import { apasImportEnabled } from "@/features/apas/flag";
import { importedAuditFor, useImportedAudit, type ImportedAudit } from "@/features/apas/importedAudit";

export interface ProgramApasComparison {
  audit: ApasAudit;
  comparison: ApasComparison;
}

/**
 * C4, per program (B1 multi-audit): for each of the plan's programs, APAS's results from **that
 * program's** audit imported in this tab, paired with planu.mn's (evaluated on the courses that audit
 * has on record). A program with no matching audit has no entry. Display only.
 */
export function apasComparisons(
  audits: readonly ImportedAudit[],
  results: ProgramResult[],
  planned: PlannedForAudit[],
): Map<string, ProgramApasComparison> {
  const out = new Map<string, ProgramApasComparison>();
  for (const r of results) {
    const audit = importedAuditFor(audits, r.program.id);
    if (audit) out.set(r.program.id, { audit, comparison: compareApasProgram(audit, r.program, planned) });
  }
  return out;
}

const NONE: Map<string, ProgramApasComparison> = new Map();

/**
 * The rail's "APAS says" data. A2 (#100), Hadi's Claude: empty while the APAS import flag is off
 * (`features/apas/flag.ts`), so no "APAS says" renders even if an audit were somehow held. Progress
 * never reads this.
 */
export function useApasComparisons(results: ProgramResult[], planned: PlannedForAudit[]): Map<string, ProgramApasComparison> {
  const audits = useImportedAudit((s) => s.audits);
  return useMemo(
    () => (apasImportEnabled() ? apasComparisons(audits, results, planned) : NONE),
    // The flag isn't a dep on purpose: `NEXT_PUBLIC_APAS_IMPORT` is inlined at build time, so it can't
    // change while the app runs.
    [audits, results, planned],
  );
}
