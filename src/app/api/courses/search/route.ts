import type { NextRequest } from "next/server";
import { searchCourses } from "@/server/catalog/search";

/** GET /api/courses/search?q=csci%202041&limit=50 → CourseSummary[] */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 50, 100);
  return Response.json(searchCourses(q, limit));
}
