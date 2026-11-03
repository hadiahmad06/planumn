import type { NextRequest } from "next/server";
import { getCourses, MAX_IDS_PER_REQUEST } from "@/server/catalog/courses";
import { fetchLibEdCodes } from "@/server/libed/libEdSource";

/**
 * GET /api/libed?ids=297,1473 → { [courseId]: string[] | null } (B3). Written by Ishaan's Claude.
 * Twin Cities CLE codes per catalog course; null when the UMN catalog has no record of the course.
 */
export async function GET(request: NextRequest) {
  const raw = (request.nextUrl.searchParams.get("ids") ?? "").split(",").filter(Boolean);
  const ids = [...new Set(raw.map(Number))];
  if (ids.some((n) => !Number.isSafeInteger(n) || n <= 0) || raw.length === 0)
    return Response.json({ error: "Pass course ids as ?ids=1,2,3" }, { status: 400 });
  if (ids.length > MAX_IDS_PER_REQUEST)
    return Response.json({ error: `At most ${MAX_IDS_PER_REQUEST} ids per request` }, { status: 400 });

  const groupOf = new Map(getCourses(ids).map((c) => [c.id, c.courseGroupId]));
  const groups = [...new Set([...groupOf.values()].filter((g): g is string => Boolean(g)))].sort();
  try {
    const codes = groups.length ? await fetchLibEdCodes(groups) : {};
    return Response.json(
      Object.fromEntries(ids.map((id) => {
        const g = groupOf.get(id);
        return [id, g && codes[g] ? codes[g] : null];
      })),
    );
  } catch {
    return Response.json({ error: "The UMN catalog didn't respond. Try again in a minute." }, { status: 502 });
  }
}
