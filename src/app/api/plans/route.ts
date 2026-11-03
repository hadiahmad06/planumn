import { planApi } from "@/features/plans/api";
import type { Plan } from "@/domain/plan";
/** Written by Michael's Codex. */
export async function GET(request: Request) {
  return planApi(request, (repo) => repo.list());
}
export async function POST(request: Request) {
  return planApi(request, async (repo) =>
    repo.save((await request.json()) as Plan),
  );
}
