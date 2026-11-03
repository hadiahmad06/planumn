"use client";

import { useMemo } from "react";
import type { ApasAudit } from "@/domain/apas";
import { compareApasProgram, type ApasComparison } from "@/domain/apasCompare";
import type { PlannedForAudit, ProgramResult } from "@/domain/requirements";
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

export function useApasComparisons(results: ProgramResult[], planned: PlannedForAudit[]): Map<string, ProgramApasComparison> {
  const audits = useImportedAudit((s) => s.audits);
  return useMemo(() => apasComparisons(audits, results, planned), [audits, results, planned]);
}
