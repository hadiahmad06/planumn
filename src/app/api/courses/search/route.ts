import type { NextRequest } from "next/server";
import { parseFilters } from "@/domain/searchFilters";
import { searchCourses } from "@/server/catalog/search";
import { fetchLibEdIndex } from "@/server/libed/libEdIndex";
import { parseLimit } from "./limit";

/**
 * GET /api/courses/search?q=csci%202041&limit=50 → CourseSummary[]. 400 if limit isn't a whole number.
 * B8 filters (all optional, `q` may be empty when one is set): libed=GP, season=fall, level=3000,
 * credits=4, minGpa=3.5, noPrereqs=1. 400 on an invalid filter; 502 if the UMN catalog (Lib Ed) is down.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = params.get("q") ?? "";
  const limit = parseLimit(params.get("limit"));
  if (limit === null) return Response.json({ error: "limit must be a whole number" }, { status: 400 });
  const filters = parseFilters(params);
  if ("error" in filters) return Response.json({ error: filters.error }, { status: 400 });

  let libEdGroups: Set<string> | undefined;
  if (filters.libEd) {
    try {
      libEdGroups = new Set((await fetchLibEdIndex())[filters.libEd] ?? []);
    } catch {
      return Response.json({ error: "The UMN catalog didn't respond. Try again in a minute." }, { status: 502 });
    }
  }
  return Response.json(searchCourses(q, limit, filters, libEdGroups));
}
