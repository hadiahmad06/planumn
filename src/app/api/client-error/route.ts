import {
  clientErrorReportsEnabled,
  errorLogEntry,
  routePattern,
  scrubQuoted,
  writeErrorLog,
} from "@/server/errors/errorLog";
import { CLIENT_REFERENCE } from "@/features/errors/report";

/**
 * L6 (Hadi's Claude, 2026-11-22): `POST /api/client-error` `{ route, digest, message, stack? }` → 204.
 * The error pages send this when a client component crashes, so the crash reaches Vercel's runtime
 * logs (the browser console doesn't). Only those four string fields are read; anything else in the
 * body is ignored and never logged.
 *
 * Abuse limits (M2/M3 on #115): same origin, `Content-Type: application/json`, at most 8 KB of bytes
 * (checked on `Content-Length`, then while reading, so a chunked body stops at the cap), `digest` must
 * be a client reference (`c-` + 8 hex, never a server digest), `route` must be a path and is logged as
 * a pattern. `CLIENT_ERROR_REPORTS=off` answers 204 without logging. A per-IP rate limit is a Vercel
 * Firewall rule (`docs/agent/error-reporting.md`).
 */
const MAX_BODY_BYTES = 8 * 1024;
const headers = { "Cache-Control": "private, no-store" };

const fail = (status: number, error: string) => Response.json({ error }, { status, headers });

/** Reads at most `max` bytes; null when the body is longer. */
async function readCapped(request: Request, max: number): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return fail(403, "Invalid request origin.");
  if (!clientErrorReportsEnabled()) return new Response(null, { status: 204, headers });
  const type = request.headers.get("content-type") ?? "";
  if (!/^application\/json\s*(;|$)/i.test(type)) return fail(415, "Send the report as application/json.");
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) return fail(413, "Error reports are at most 8 KB.");

  const text = await readCapped(request, MAX_BODY_BYTES).catch(() => null);
  if (text === null) return fail(413, "Error reports are at most 8 KB.");
  if (!text) return fail(400, "Send a JSON error report.");
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return fail(400, "Send a JSON error report.");
  }
  const { route, digest, message, stack } = (body ?? {}) as Record<string, unknown>;
  if (typeof route !== "string" || !route.startsWith("/") || typeof message !== "string")
    return fail(400, "route (a path) and message are required.");
  if (typeof digest !== "string" || !CLIENT_REFERENCE.test(digest))
    return fail(400, "digest must be a client reference (c- and 8 hex digits).");

  writeErrorLog(
    errorLogEntry({
      source: "client",
      route: routePattern(route),
      digest,
      message: scrubQuoted(message),
      stack: typeof stack === "string" ? scrubQuoted(stack) : undefined,
    }),
  );
  return new Response(null, { status: 204, headers });
}
