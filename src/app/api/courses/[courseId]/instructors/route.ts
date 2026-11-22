import { getInstructorInsights } from "@/server/catalog/instructors";
import { logServerError } from "@/server/errors/errorLog";
/** Written by Michael's Codex. Public historical aggregates only. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await context.params;
  const id = Number(courseId);
  if (!/^\d+$/.test(courseId) || !Number.isSafeInteger(id) || id <= 0)
    return Response.json(
      { error: "Choose a valid course ID." },
      { status: 400 },
    );
  try {
    return Response.json(getInstructorInsights(id));
  } catch (error) {
    logServerError("/api/courses/[courseId]/instructors", error);
    return Response.json(
      { error: "Instructor history could not be loaded. Please try again." },
      { status: 503 },
    );
  }
}
