/**
 * Pure helpers for running an APAS audit automatically (B1, Hadi's decision 2026-10-27). Written by
 * Hadi's Claude from real uAchieve 5.2 pages (Run APAS, Completed APAS list, audit results).
 * No DOM or extension APIs here, so src/features/apas/automation.test.ts can run them in a VM.
 */
// A global on purpose, like protocol.js: content scripts share it by load order.
var PLANUMN_AUTO = {
  CREATE_PATH: "/selfservice/audit/create.html",
  LIST_PATH: "/selfservice/audit/list.html",
  /** Give up waiting for the new audit after this long (the list page refreshes itself every few seconds). */
  WAIT_MS: 4 * 60 * 1000,
  /** Reload the list ourselves this often if the page hasn't. */
  RELOAD_MS: 5000,

  /** Which APAS page this is: "create", "list", "audit" or "other". */
  pageKind(pathname, hasAudit) {
    if (hasAudit) return "audit";
    if (pathname.endsWith("/audit/create.html")) return "create";
    if (pathname.endsWith("/audit/list.html")) return "list";
    return "other";
  },

  /** The audit id from a "read.html?id=…" link, or null. */
  auditId(href) {
    const m = /[?&]id=([^&#]+)/.exec(href || "");
    return m ? decodeURIComponent(m[1]) : null;
  },

  /**
   * A degree program (not honors, lower-division or a course check): APAS code "1 PPPP SS DDD" with a
   * real degree part. Same rule as apasProgramId in src/domain/apasPlan.ts.
   */
  isDegreeProgram(code) {
    const c = String(code || "").trim();
    return /^1\d{9}$/.test(c) && c.slice(7) !== "000";
  },

  /**
   * Pick the audit to send from the completed list: rows not in `baseline` (they appeared after we ran
   * the audit), preferring a degree program, in list order (newest first). Null while none is new.
   * rows: [{ id, program }] in page order.
   */
  pickNewAudit(rows, baseline) {
    const seen = new Set(baseline || []);
    const fresh = rows.filter((r) => r.id && !seen.has(r.id));
    if (fresh.length === 0) return null;
    return fresh.find((r) => PLANUMN_AUTO.isDegreeProgram(r.program)) || fresh[0];
  },
};
