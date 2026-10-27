import { getProgram } from "@/server/programs/getProgram";

/** GET /api/programs/019627107 → Program (requirements with courses resolved). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9A-Z]{6,12}$/i.test(id)) return Response.json({ error: "Invalid program id" }, { status: 400 });
  try {
    const program = await getProgram(id);
    if (!program) return Response.json({ error: "Program not found" }, { status: 404 });
    return Response.json(program);
  } catch {
    return Response.json({ error: "The UMN catalog didn't respond. Try again in a minute." }, { status: 502 });
  }
}
