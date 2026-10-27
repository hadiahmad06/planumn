import { planApi } from "@/features/plans/api";
import { RepositoryError } from "@/features/plans/serverRepository";
type Context = { params: Promise<{ planId: string }> };
/** Written by Michael's Codex. */
export async function GET(request: Request, context: Context) {
  return planApi(request, async (repo) => {
    const plan = await repo.get((await context.params).planId);
    if (!plan)
      throw new RepositoryError(
        "Plan not found, or you do not have access.",
        404,
      );
    return plan;
  });
}
export async function PATCH(request: Request, context: Context) {
  return planApi(request, async (repo) => {
    const { planId } = await context.params;
    const { action } = await request.json();
    if (action === "delete") await repo.softDelete(planId);
    else if (action === "recover") await repo.recover(planId);
    else throw new RepositoryError("Unknown plan action.", 400);
    return { success: true };
  });
}
export async function DELETE(request: Request, context: Context) {
  return planApi(request, async (repo) => {
    await repo.hardDelete((await context.params).planId);
    return { success: true };
  });
}
