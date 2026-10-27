import { findCourseIdsByCode } from "@/server/catalog/courses";
import { extractTranscriptText } from "@/features/transcript/pdf";
import { transcriptCourses, transcriptPlan } from "@/features/transcript/parse";
/** Written by Michael's Codex. No persistence here; importing a reviewed plan uses normal autosave. */
export async function POST(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json(
      { error: "Invalid request origin." },
      { status: 403, headers },
    );
  if (Number(request.headers.get("content-length")) > 6 * 1024 * 1024)
    return Response.json(
      { error: "Upload a PDF smaller than 5 MB." },
      { status: 413, headers },
    );
  try {
    const data = await request.formData();
    const file = data.get("file");
    if (!(file instanceof File) || !file.size)
      return Response.json(
        { error: "Choose a transcript PDF." },
        { status: 400, headers },
      );
    if (file.size > 5 * 1024 * 1024)
      return Response.json(
        { error: "Upload a PDF smaller than 5 MB." },
        { status: 413, headers },
      );
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.subarray(0, 5).toString() !== "%PDF-")
      return Response.json(
        { error: "The selected file is not a PDF." },
        { status: 400, headers },
      );
    const terms = transcriptCourses(await extractTranscriptText(buffer));
    const result = transcriptPlan(
      terms,
      findCourseIdsByCode([...terms.values()].flat()),
    );
    return Response.json(result, { headers });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The transcript could not be imported.",
      },
      { status: 422, headers },
    );
  }
}
