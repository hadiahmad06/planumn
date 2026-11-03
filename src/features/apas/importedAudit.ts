import { create } from "zustand";
import type { ApasAudit } from "@/domain/apas";
import { useAuthStore } from "@/features/auth/useAuth";

/**
 * The APAS audit parsed on /plan/apas, kept for the requirements rail's "APAS says" lines (Phase C/C4,
 * Hadi's Claude). **Memory only**: a module-level store, so it survives moving from /plan/apas into the
 * editor in the same tab (client-side navigation) and is gone on reload or when the tab closes. It is
 * never written to browser storage, a plan, Supabase or the server, which keeps the privacy promise in
 * docs/agent/apas-research.md §3.
 *
 * Cleared when the signed-in account changes (sign-out, sign-in, switching accounts), because sign-out
 * only refreshes the page and module state would otherwise outlive it (review fix on #89). Also cleared
 * when a new import starts, fails, or is discarded.
 */
interface ImportedAuditStore {
  audit: ApasAudit | null;
}

export const useImportedAudit = create<ImportedAuditStore>()(() => ({ audit: null }));

export function setImportedAudit(audit: ApasAudit | null) {
  useImportedAudit.setState({ audit });
}

// The first answer after loading only says who is already signed in, so it doesn't count as a change.
useAuthStore.subscribe((next, prev) => {
  if (!prev.loading && (next.user?.id ?? null) !== (prev.user?.id ?? null)) setImportedAudit(null);
});
