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

let reference: string | undefined;
let reported = false;

/** One `c-…` reference per page load, so the reference shown always matches the one logged report. */
export function pageReference(): string {
  reference ??= clientReference();
  return reference;
}

/** The report for a client-side crash. Pure, for tests. */
export function clientErrorReport(error: unknown, pathname: string, reference: string): ClientErrorReport {
  const message =
    error instanceof Error ? error.message || error.name : typeof error === "string" ? error : "Non-Error value thrown";
  const report: ClientErrorReport = { route: pathname.split(/[?#]/, 1)[0] || "/", digest: reference, message };
  if (error instanceof Error && error.stack) report.stack = error.stack.slice(0, 3000);
  return report;
}

/**
 * Fire and forget: reporting must never throw or block the error page. At most one report per page
 * load (M3 on #115): a boundary can re-render or fail again after "Try again".
 */
export function sendClientErrorReport(report: ClientErrorReport): void {
  if (reported) return;
  reported = true;
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
}
