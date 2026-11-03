import { create } from "zustand";
import type { ApasAudit } from "@/domain/apas";

/**
 * The APAS audit parsed on /plan/apas, kept for the requirements rail's "APAS says" lines (Phase C/C4,
 * Hadi's Claude). **Memory only**: a module-level store, so it survives moving from /plan/apas into the
 * editor in the same tab (client-side navigation) and is gone on reload or when the tab closes. It is
 * never written to browser storage, a plan, Supabase or the server, which keeps the privacy promise in
 * docs/agent/apas-research.md §3.
 */
interface ImportedAuditStore {
  audit: ApasAudit | null;
}

export const useImportedAudit = create<ImportedAuditStore>()(() => ({ audit: null }));

export function setImportedAudit(audit: ApasAudit | null) {
  useImportedAudit.setState({ audit });
}
