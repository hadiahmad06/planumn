import { catalogCheck } from "@/server/catalog-changes/snapshot";
/** Written by Michael's Codex. Body contains public identifiers only, never a plan or APAS record. */
export async function POST(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json(
      { error: "Invalid request origin." },
      { status: 403, headers },
    );
  try {
    const text = await request.text();
    if (text.length > 16000)
      return Response.json(
        { error: "Catalog check batch is too large." },
        { status: 413, headers },
      );
    let body: { courseIds?: unknown; programIds?: unknown } | null;
    try {
      body = JSON.parse(text);
    } catch {
      return Response.json(
        { error: "Send a JSON catalog check request." },
        { status: 400, headers },
      );
    }
    if (
      !body ||
      Array.isArray(body) ||
      Object.keys(body).some(
        (key) => key !== "courseIds" && key !== "programIds",
      )
    )
      return Response.json(
        { error: "Send public catalog identifiers only." },
        { status: 400, headers },
      );
    const courses = body?.courseIds,
      programs = body?.programIds;
    if (
      !Array.isArray(courses) ||
      courses.length > 200 ||
      !courses.every((id) => Number.isSafeInteger(id) && id > 0) ||
      !Array.isArray(programs) ||
      programs.length > 5 ||
      !programs.every(
        (id) => typeof id === "string" && /^[A-Za-z0-9]{1,40}$/.test(id),
      )
    )
      return Response.json(
        {
          error:
            "Send at most 200 valid course IDs and 5 program IDs per check.",
        },
        { status: 400, headers },
      );
    return Response.json(
      await catalogCheck([...new Set(courses)], [...new Set(programs)]),
      { headers },
    );
  } catch {
    return Response.json(
      { error: "Catalog data could not be checked. Try again." },
      { status: 503, headers },
    );
  }
}
