"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clearImportedAudits } from "./importedAudit";
import { APAS_PROTOCOL, newNonce, pageMessage, readExtensionMessage, type ApasReport } from "./protocol";

export type ApasImportState =
  | { phase: "checking" }
  | { phase: "missing" }
  | { phase: "ready"; version: string }
  | { phase: "waiting" }
  | { phase: "received"; report: ApasReport }
  | { phase: "error"; message: string };

/** How long to wait for the extension's bridge to answer before showing "install the extension". */
const DETECT_MS = 1500;

/**
 * Talks to the APAS import extension through window.postMessage (B1 step 1). Owned by Ishaan's Claude.
 * The received report lives only in this hook's React state: it is never written to storage or sent
 * to a server, and it's gone when the tab closes or `discard()` runs.
 */
export function useApasImport() {
  const [state, setState] = useState<ApasImportState>({ phase: "checking" });
  const nonce = useRef<string | null>(null);

  useEffect(() => {
    // C4: a failed import must not leave an older audit looking current in the rail (review fix, #89).
    const fail = (message: string) => {
      clearImportedAudits();
      setState({ phase: "error", message });
    };
    const self = { origin: window.location.origin, window };
    const onMessage = (event: MessageEvent) => {
      const msg = readExtensionMessage(event, self, nonce.current);
      if (!msg) return;
      if (msg.type === APAS_PROTOCOL.READY)
        setState((s) => (s.phase === "checking" || s.phase === "missing" ? { phase: "ready", version: msg.version } : s));
      else if (msg.type === APAS_PROTOCOL.STATUS) {
        if (msg.status === "cancelled") fail("The APAS tab was closed before a report was sent.");
        if (msg.status === "error") fail("The extension couldn't open APAS. Try again.");
      } else if (msg.type === APAS_PROTOCOL.REPORT) {
        nonce.current = null; // one report per import
        setState({ phase: "received", report: msg.report });
      }
    };
    window.addEventListener("message", onMessage);
    window.postMessage(pageMessage(APAS_PROTOCOL.HELLO), window.location.origin);
    const timer = setTimeout(() => setState((s) => (s.phase === "checking" ? { phase: "missing" } : s)), DETECT_MS);
    return () => {
      window.removeEventListener("message", onMessage);
      clearTimeout(timer);
    };
  }, []);

  const start = useCallback(() => {
    nonce.current = newNonce();
    // B1 multi-audit: starting keeps the reports already held (listed on the page), so a second program's
    // report can join them; a report for a program already held replaces it once it arrives. If this
    // import fails, every held report is cleared (above), so nothing older is left looking current.
    setState({ phase: "waiting" });
    window.postMessage(pageMessage(APAS_PROTOCOL.START, nonce.current), window.location.origin);
  }, []);

  const discard = useCallback(() => {
    nonce.current = null;
    clearImportedAudits(); // C4: Discard removes every held audit, from the page and the rail
    setState({ phase: "ready", version: "" });
  }, []);

  return { state, start, discard };
}
