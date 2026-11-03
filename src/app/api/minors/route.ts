import type { NextRequest } from "next/server";
import { rankMinors } from "@/domain/minors";
import programOptions from "@/features/requirements/programOptions.json";
import { getCourses, MAX_IDS_PER_REQUEST } from "@/server/catalog/courses";
import { fetchMinorPrograms } from "@/server/minors/minorIndex";

/** Undergraduate minors from the program list (no certificates are listed there yet). */
const MINOR_IDS = (programOptions as { id: string; name: string }[]).filter((o) => /\bMinor\b/.test(o.name)).map((o) => o.id);
const TOP = 15;

/**
 * GET /api/minors?ids=1473,77&exclude=0004MIN02 → MinorFit[] with matched course codes (B14).
 * Written by Ishaan's Claude. `ids` = planned course ids; `exclude` = program ids already in the plan.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const raw = (params.get("ids") ?? "").split(",").filter(Boolean);
  const ids = [...new Set(raw.map(Number))];
  if (raw.length === 0 || ids.some((n) => !Number.isSafeInteger(n) || n <= 0))
    return Response.json({ error: "Pass planned course ids as ?ids=1,2,3" }, { status: 400 });
  if (ids.length > MAX_IDS_PER_REQUEST) return Response.json({ error: `At most ${MAX_IDS_PER_REQUEST} ids` }, { status: 400 });
  const exclude = new Set((params.get("exclude") ?? "").split(",").filter((x) => /^[0-9A-Z]{6,12}$/i.test(x)));

  let programs;
  try {
    programs = await fetchMinorPrograms(MINOR_IDS);
  } catch {
    return Response.json({ error: "The UMN catalog didn't respond. Try again in a minute." }, { status: 502 });
  }
  const courses = getCourses(ids);
  const code = new Map(courses.map((c) => [c.id, `${c.dept} ${c.number}`]));
  const fits = rankMinors(
    programs,
    courses.map((c) => ({ courseId: c.id, credits: c.credits.min })),
    exclude,
  ).slice(0, TOP);
  return Response.json({
    checked: programs.length,
    minors: fits.map((f) => ({ ...f, matched: f.matched.map((id) => ({ id, code: code.get(id) ?? String(id) })) })),
  });
}
