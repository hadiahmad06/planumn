import { listDepartments } from "@/server/catalog/courses";

/** GET /api/departments → { code, name }[] (Twin Cities), for natural-language search (B27). */
export async function GET() {
  return Response.json(listDepartments(), { headers: { "Cache-Control": "public, max-age=86400" } });
}
