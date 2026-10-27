import type { NextRequest } from "next/server";
import { getCourses, MAX_IDS_PER_REQUEST } from "@/server/catalog/courses";

/** GET /api/courses?ids=77,87 → CourseDetails[] (unknown ids are skipped). */
export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
  if (ids.length > MAX_IDS_PER_REQUEST) {
    return Response.json({ error: `At most ${MAX_IDS_PER_REQUEST} ids per request` }, { status: 400 });
  }
  return Response.json(getCourses(ids));
}
