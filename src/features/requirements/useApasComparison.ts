"use client";

import { useMemo } from "react";
import type { ApasAudit } from "@/domain/apas";
import { compareApasProgram, type ApasComparison } from "@/domain/apasCompare";
import { apasProgramId } from "@/domain/apasPlan";
import type { PlannedForAudit, ProgramResult } from "@/domain/requirements";
import { useImportedAudit } from "@/features/apas/importedAudit";
import { PROGRAM_OPTIONS } from "./programOptions";

const PROGRAM_IDS = PROGRAM_OPTIONS.map((p) => p.id);

export interface ProgramApasComparison {
  audit: ApasAudit;
  comparison: ApasComparison;
}

/**
 * C4: for each of the plan's programs that the APAS audit imported in this tab is for, APAS's results
 * paired with planu.mn's (evaluated on the courses the audit has on record). Empty when no audit was
 * imported, or when it's for another program. Display only.
 */
export function useApasComparisons(results: ProgramResult[], planned: PlannedForAudit[]): Map<string, ProgramApasComparison> {
  const audit = useImportedAudit((s) => s.audit);
  return useMemo(() => {
    const out = new Map<string, ProgramApasComparison>();
    if (!audit) return out;
    const programId = apasProgramId(audit.program.code, PROGRAM_IDS);
    for (const r of results)
      if (r.program.id === programId) out.set(r.program.id, { audit, comparison: compareApasProgram(audit, r.program, planned) });
    return out;
  }, [audit, results, planned]);
}
