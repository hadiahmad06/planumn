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
  return `[planumn:error] ${JSON.stringify(entry)}`;
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
