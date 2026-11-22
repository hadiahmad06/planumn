/**
 * L6 (Hadi's Claude, 2026-11-22): what the error pages send to `POST /api/client-error`.
 *
 * A server error already reached the logs through `onRequestError` and arrives here with Next.js's
 * digest, so it isn't sent again. A client-side crash has no digest, so the page makes its own
 * reference (`c-` + 8 hex), shows it to the student and sends it with the report. Only the pathname
 * (no query string, no `#` share snapshot), the reference, the message and the stack are sent.
 */

export type ClientErrorReport = { route: string; digest: string; message: string; stack?: string };

export function serverDigest(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "digest" in error) {
    const digest = (error as { digest: unknown }).digest;
    if (typeof digest === "string" && digest) return digest;
  }
  return undefined;
}

/** The shape `/api/client-error` accepts for `digest`. */
export const CLIENT_REFERENCE = /^c-[0-9a-f]{8}$/;

export function clientReference(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return `c-${[...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Per-document reporting state (blocking finding on #115, at 2366ac0). A client-side navigation keeps
 * the document, so this state is keyed on the crash (pathname + message) rather than kept as one
 * value: a different crash on another route gets its own reference and its own report, while one
 * crash re-rendering or failing again after "Try again" (M3) keeps its reference and isn't resent.
 */
export const MAX_REPORTS_PER_DOCUMENT = 5;
/** Bounds the reference map too; a page that crashes this often has bigger problems. */
const MAX_REFERENCES = 50;
const references = new Map<string, string>();
const reportedCrashes = new Set<string>();

/** What makes two crashes "the same": the pathname (no query or `#`) and the message. */
export function crashKey(error: unknown, pathname: string): string {
  return `${routeOf(pathname)}\n${messageOf(error)}`;
}

/**
 * The `c-…` reference for this crash, the same one on every render, so the reference shown matches
 * the one logged report. During the server render (no `window`) nothing is cached: that state would
 * be shared between requests.
 */
export function crashReference(error: unknown, pathname: string): string {
  if (typeof window === "undefined") return clientReference();
  const key = crashKey(error, pathname);
  let reference = references.get(key);
  if (!reference) {
    if (references.size >= MAX_REFERENCES) references.delete(references.keys().next().value!);
    reference = clientReference();
    references.set(key, reference);
  }
  return reference;
}

/** Test hook: a fresh document. */
export function resetReportState(): void {
  references.clear();
  reportedCrashes.clear();
}

function routeOf(pathname: string): string {
  return pathname.split(/[?#]/, 1)[0] || "/";
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message || error.name : typeof error === "string" ? error : "Non-Error value thrown";
}

/** The report for a client-side crash. Pure, for tests. */
export function clientErrorReport(error: unknown, pathname: string, reference: string): ClientErrorReport {
  const report: ClientErrorReport = { route: routeOf(pathname), digest: reference, message: messageOf(error) };
  if (error instanceof Error && error.stack) report.stack = error.stack.slice(0, 3000);
  return report;
}

/**
 * Fire and forget: reporting must never throw or block the error page. One report per crash (M3 on
 * #115: a boundary can re-render or fail again after "Try again"), keyed like `crashReference`, and at
 * most `MAX_REPORTS_PER_DOCUMENT` per document. Returns whether a report was sent.
 */
export function sendClientErrorReport(report: ClientErrorReport): boolean {
  const key = `${report.route}\n${report.message}`;
  if (reportedCrashes.has(key) || reportedCrashes.size >= MAX_REPORTS_PER_DOCUMENT) return false;
  reportedCrashes.add(key);
  try {
    void fetch("/api/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* Offline, or fetch unavailable: the page still shows the reference. */
  }
  return true;
}
