import { findCourseIdsByCode } from "@/server/catalog/courses";

const MAX_CODES = 400;
const CODE = /^([A-Z]{1,5}) ([0-9][0-9A-Z]{2,5})$/;

/**
 * POST /api/courses/by-code `{ codes: ["CSCI 1001", …] }` → `{ ids: { "CSCI 1001": 3480 } }` (APAS import).
 * Written by Hadi's Claude. A POST body, not a query string, because the list comes from a student's
 * record. Only course codes are sent; nothing is logged or stored.
 */
export async function POST(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json(
      { error: "Invalid request origin." },
      { status: 403, headers },
    );
  const body = (await request.json().catch(() => null)) as {
    codes?: unknown;
  } | null;
  const codes = Array.isArray(body?.codes) ? body.codes : null;
  if (
    !codes ||
    codes.length > MAX_CODES ||
    !codes.every((c) => typeof c === "string")
  )
    return Response.json(
      { error: `Send { codes: string[] } with at most ${MAX_CODES} codes.` },
      { status: 400, headers },
    );
  const parsed = [...new Set(codes.map((c) => c.trim().toUpperCase()))].flatMap(
    (c) => {
      const m = c.match(CODE);
      return m ? [{ dept: m[1], number: m[2] }] : [];
    },
  );
  return Response.json(
    { ids: Object.fromEntries(findCourseIdsByCode(parsed)) },
    { headers },
  );
}
