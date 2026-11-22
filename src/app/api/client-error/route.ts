import { errorLogEntry, writeErrorLog } from "@/server/errors/errorLog";

/**
 * L6 (Hadi's Claude, 2026-11-22): `POST /api/client-error` `{ route, digest, message, stack? }` → 204.
 * The error pages send this when a client component crashes, so the crash reaches Vercel's runtime
 * logs (the browser console doesn't). Same origin only, small bodies only, and only those four string
 * fields are read: anything else in the body is ignored and never logged.
 */
const MAX_BODY = 8 * 1024;
const headers = { "Cache-Control": "private, no-store" };

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json({ error: "Invalid request origin." }, { status: 403, headers });
  const text = await request.text().catch(() => "");
  if (!text || text.length > MAX_BODY)
    return Response.json({ error: "Send a small JSON error report." }, { status: 413, headers });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: "Send a JSON error report." }, { status: 400, headers });
  }
  const { route, digest, message, stack } = (body ?? {}) as Record<string, unknown>;
  if (typeof route !== "string" || typeof message !== "string" || typeof digest !== "string")
    return Response.json({ error: "route, digest and message are required." }, { status: 400, headers });
  writeErrorLog(
    errorLogEntry({
      source: "client",
      route,
      digest,
      message,
      stack: typeof stack === "string" ? stack : undefined,
    }),
  );
  return new Response(null, { status: 204, headers });
}
