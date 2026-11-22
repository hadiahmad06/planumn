/**
 * L6 error reporting (Hadi's Claude, 2026-11-22): one JSON line per error on stderr, which Vercel keeps
 * in its runtime logs. No vendor. See `docs/agent/error-reporting.md`.
 *
 * A line holds **only** `source`, `route`, `digest`, `message` and `stack`. Never pass a request body,
 * plan, course list, name or APAS record here. Messages and stacks are capped, and anything shaped like
 * an email address is replaced, so a library error that quotes an account can't leak it.
 */

export type ErrorSource = "render" | "api" | "client";

export type ErrorLogEntry = {
  source: ErrorSource;
  /** Route pattern ("/plan/[id]") or a pathname with no query string or fragment. */
  route: string;
  /** Next.js's error digest (server), or the page's own `c-…` reference (client). */
  digest?: string;
  message: string;
  stack?: string;
};

export const MAX_MESSAGE = 500;
export const MAX_STACK_LINES = 15;
export const MAX_STACK = 3000;
const MAX_ROUTE = 200;

const EMAIL = /[^\s@<>"'()]+@[^\s@<>"'()]+\.[a-z]{2,}/gi;

function clean(text: string, max: number): string {
  const scrubbed = text.replace(EMAIL, "[email]");
  return scrubbed.length > max ? `${scrubbed.slice(0, max)}…` : scrubbed;
}

/** A pathname with the query string and fragment dropped (search terms, share snapshots). */
export function routeOnly(path: string): string {
  const bare = path.split(/[?#]/, 1)[0] || "/";
  return clean(bare, MAX_ROUTE);
}

/** The message of whatever was thrown (thrown values need not be `Error`s). */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message || error.name;
  if (typeof error === "string") return error;
  // Supabase returns plain `{ message, code, … }` objects; only `message` is read.
  if (typeof error === "object" && error !== null && typeof (error as { message?: unknown }).message === "string")
    return (error as { message: string }).message;
  return "Non-Error value thrown";
}

export function errorDigest(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "digest" in error) {
    const digest = (error as { digest: unknown }).digest;
    if (typeof digest === "string" || typeof digest === "number") return String(digest);
  }
  return undefined;
}

/** Builds the logged entry, applying the caps and scrubbing. Pure, for tests. */
export function errorLogEntry(input: {
  source: ErrorSource;
  route: string;
  digest?: string;
  message: string;
  stack?: string;
}): ErrorLogEntry {
  const entry: ErrorLogEntry = {
    source: input.source,
    route: routeOnly(input.route),
    message: clean(input.message, MAX_MESSAGE),
  };
  if (input.digest) entry.digest = clean(input.digest, 100);
  if (input.stack) {
    const lines = input.stack.split("\n").slice(0, MAX_STACK_LINES).join("\n");
    entry.stack = clean(lines, MAX_STACK);
  }
  return entry;
}

/** The exact line written to the log (prefixed so it's easy to filter on in Vercel). */
export function errorLogLine(entry: ErrorLogEntry): string {
  // JSON.stringify leaves U+2028/U+2029 (line/paragraph separators) raw; escape them too.
  const json = JSON.stringify(entry).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  return `[planumn:error] ${json}`;
}

// Greedy, per line: from the first quote to the last, so nested quotes (JSON) can't leave text behind.
const QUOTED = /["'`].*["'`]/g;

/**
 * Client messages can quote what the browser was handling (V8's `JSON.parse` errors quote their input,
 * which could be a plan). Everything from the first to the last quote on a line becomes `"[text]"` before a client report is logged.
 */
export function scrubQuoted(text: string): string {
  return text.replace(QUOTED, '"[text]"');
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A client pathname as a route pattern, like the server lines (M3 on #115): `/plan/<uuid>` →
 * `/plan/[planId]`; any other UUID or long number segment → `[id]`.
 */
export function routePattern(pathname: string): string {
  const segments = routeOnly(pathname).split("/");
  return segments
    .map((segment, i) => {
      if (UUID.test(segment)) return segments[i - 1] === "plan" ? "[planId]" : "[id]";
      if (/^\d{4,}$/.test(segment)) return "[id]";
      return segment;
    })
    .join("/");
}

/**
 * Kill switch (M3 on #115): `CLIENT_ERROR_REPORTS=off` in the Vercel project's environment makes
 * `/api/client-error` answer 204 without logging, and turns off `/info/error-check/server`.
 * Read at request time, so changing it needs no rebuild (a redeploy picks up env changes on Vercel).
 */
export function clientErrorReportsEnabled(): boolean {
  return process.env.CLIENT_ERROR_REPORTS?.trim().toLowerCase() !== "off";
}

/**
 * N1 on #115: a client component that throws while the server renders its HTML (`server-rendering`)
 * throws again in the browser, where the error page reports it under the `c-…` reference the student
 * sees. Logging the server copy too would give one crash two references, so it's skipped. Server
 * Component errors, actions, route handlers and proxy are always logged.
 */
export function shouldLogRequestError(context: { routeType?: string; renderSource?: string }): boolean {
  return !(context.routeType === "render" && context.renderSource === "server-rendering");
}

export function writeErrorLog(entry: ErrorLogEntry): void {
  console.error(errorLogLine(entry));
}

/**
 * For a `catch` in a route handler that turns a failure into a 5xx response: Next.js never sees those
 * errors, so `onRequestError` can't log them. `route` is the handler's route pattern.
 */
export function logServerError(route: string, error: unknown): void {
  writeErrorLog(
    errorLogEntry({
      source: "api",
      route,
      digest: errorDigest(error),
      message: errorMessage(error),
      stack: error instanceof Error ? error.stack : undefined,
    }),
  );
}
