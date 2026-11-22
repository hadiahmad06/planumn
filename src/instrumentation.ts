import type { Instrumentation } from "next";
import { errorDigest, errorLogEntry, errorMessage, writeErrorLog } from "@/server/errors/errorLog";

/**
 * L6 (Hadi's Claude, 2026-11-22): Next.js calls this for every error it catches on the server
 * (Server Components, route handlers that throw, server actions, proxy). It logs one line with the
 * route pattern, the digest the student's error page shows, and the message and stack. The request's
 * headers, cookies, query string and body are never logged. See `docs/agent/error-reporting.md`.
 */
export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  writeErrorLog(
    errorLogEntry({
      source: context.routeType === "route" ? "api" : "render",
      route: context.routePath || request.path,
      digest: errorDigest(error),
      message: errorMessage(error),
      stack: error instanceof Error ? error.stack : undefined,
    }),
  );
};
