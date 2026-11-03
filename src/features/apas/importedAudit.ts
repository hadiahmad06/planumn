import { create } from "zustand";
import type { ApasAudit } from "@/domain/apas";
import { apasProgramId } from "@/domain/apasPlan";
import { useAuthStore } from "@/features/auth/useAuth";
import { PROGRAM_OPTIONS } from "@/features/requirements/programOptions";

/**
 * The APAS audits parsed on /plan/apas, kept for building one plan from several reports (B1 multi-audit)
 * and for the requirements rail's "APAS says" lines (Phase C/C4). Written by Hadi's Claude.
 *
 * **Memory only**: a module-level store, so it survives moving from /plan/apas into the editor in the same
 * tab (client-side navigation) and is gone on reload or when the tab closes. It is never written to
 * browser storage, a plan, Supabase or the server, which keeps the privacy promise in
 * docs/agent/apas-research.md §3.
 *
 * One audit per program (APAS shows one program per report), keyed by the planu.mn program it maps to
 * (`apasProgramId`), or by its APAS code when it maps to none. A second report for the same program
 * replaces the first. Cleared when the signed-in account changes (sign-out, sign-in, switching accounts),
 * because sign-out only refreshes the page and module state would otherwise outlive it (review fix on
 * #89). Also cleared by Discard, and when an import fails or the page sent isn't an audit.
 */
export interface ImportedAudit {
  /** The mapped planu.mn program id, or `apas:<APAS code>` when it maps to none. */
  key: string;
  /** The mapped planu.mn program id, if any. */
  programId: string | null;
  audit: ApasAudit;
}

interface ImportedAuditStore {
  /** In import order; a replaced program keeps its place. */
  audits: ImportedAudit[];
}

const PROGRAM_IDS = PROGRAM_OPTIONS.map((p) => p.id);

export const useImportedAudit = create<ImportedAuditStore>()(() => ({ audits: [] }));

/** How an audit is held: its mapped program, else its APAS code. */
export function importedAuditKey(audit: ApasAudit, programIds: readonly string[] = PROGRAM_IDS): ImportedAudit {
  const programId = apasProgramId(audit.program.code, programIds);
  return { key: programId ?? `apas:${audit.program.code.trim() || audit.program.title.trim()}`, programId, audit };
}

/** Hold a parsed audit, replacing any audit already held for the same program. */
export function addImportedAudit(audit: ApasAudit) {
  const next = importedAuditKey(audit);
  useImportedAudit.setState(({ audits }) => {
    const at = audits.findIndex((a) => a.key === next.key);
    if (at < 0) return { audits: [...audits, next] };
    if (audits[at].audit === audit) return { audits };
    return { audits: audits.map((a, i) => (i === at ? next : a)) };
  });
}

/** Forget every held audit (Discard, a failed or non-audit import, another account). */
export function clearImportedAudits() {
  if (useImportedAudit.getState().audits.length) useImportedAudit.setState({ audits: [] });
}

/** The held audit for a planu.mn program, if any. */
export function importedAuditFor(audits: readonly ImportedAudit[], programId: string): ApasAudit | null {
  return audits.find((a) => a.programId === programId)?.audit ?? null;
}

// The first answer after loading only says who is already signed in, so it doesn't count as a change.
useAuthStore.subscribe((next, prev) => {
  if (!prev.loading && (next.user?.id ?? null) !== (prev.user?.id ?? null)) clearImportedAudits();
});
