import type { NextRequest } from "next/server";
import { searchCourses } from "@/server/catalog/search";
import { parseLimit } from "./limit";

/** GET /api/courses/search?q=csci%202041&limit=50 → CourseSummary[]. 400 if limit isn't a whole number. */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const limit = parseLimit(request.nextUrl.searchParams.get("limit"));
  if (limit === null) return Response.json({ error: "limit must be a whole number" }, { status: 400 });
  return Response.json(searchCourses(q, limit));
}
