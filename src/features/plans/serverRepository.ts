import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanRepository } from "@/contracts/plan-repository";
import type { Plan } from "@/domain/plan";
import { isPlan, normalizePlan } from "./validation";
export class RepositoryError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
/** Written by Michael's Codex. Every operation scopes to the authenticated owner as well as RLS. */
export class SupabasePlanRepository implements PlanRepository {
  constructor(
    private client: SupabaseClient,
    private owner: string,
  ) {}
  async list(): Promise<Plan[]> {
    const plans: Plan[] = [];
    for (let start = 0; ; start += 1000) {
      const { data, error } = await this.client
        .from("plans")
        .select("*")
        .eq("user_id", this.owner)
        .order("last_updated", { ascending: false })
        .range(start, start + 999);
      if (error)
        throw new RepositoryError("Your plans could not be loaded.", 500);
      plans.push(...(data as Plan[]).map(normalizePlan));
      if (data.length < 1000) return plans;
    }
  }
  async get(id: string): Promise<Plan | null> {
    const { data, error } = await this.client
      .from("plans")
      .select("*")
      .eq("id", id)
      .eq("user_id", this.owner)
      .maybeSingle();
    if (error) throw new RepositoryError("This plan could not be loaded.", 500);
    return data ? normalizePlan(data as Plan) : null;
  }
  async save(plan: Plan): Promise<Plan> {
    if (!isPlan(plan)) throw new RepositoryError("The plan is invalid.", 400);
    const fields = {
      title: plan.title,
      programs: plan.programs,
      semesters: plan.semesters,
      last_updated: new Date().toISOString(),
    };
    const query = plan.id
      ? this.client
          .from("plans")
          .update(fields)
          .eq("id", plan.id)
          .eq("user_id", this.owner)
          .is("deletion_scheduled_at", null)
      : this.client
          .from("plans")
          .insert({ ...fields, user_id: this.owner, can_view: [] });
    const { data, error } = await query.select("*").maybeSingle();
    if (error)
      throw new RepositoryError(
        "Your plan could not be saved. Your edits are still open.",
        500,
      );
    if (!data)
      throw new RepositoryError(
        "This plan is unavailable or in the recycle bin.",
        404,
      );
    return normalizePlan(data as Plan);
  }
  async softDelete(id: string) {
    const { data, error } = await this.client.rpc("now_plus_30_days");
    if (error || typeof data !== "string" || !Number.isFinite(Date.parse(data)))
      throw new RepositoryError(
        "Deletion could not be scheduled. Please try again.",
        500,
      );
    const result = await this.client
      .from("plans")
      .update({ deletion_scheduled_at: data })
      .eq("id", id)
      .eq("user_id", this.owner)
      .select("id")
      .maybeSingle();
    if (result.error || !result.data)
      throw new RepositoryError(
        "The plan could not be moved to the recycle bin.",
        500,
      );
  }
  async recover(id: string) {
    const result = await this.client
      .from("plans")
      .update({ deletion_scheduled_at: null })
      .eq("id", id)
      .eq("user_id", this.owner)
      .gt("deletion_scheduled_at", new Date().toISOString())
      .select("id")
      .maybeSingle();
    if (result.error || !result.data)
      throw new RepositoryError(
        "The plan could not be recovered. Its recovery period may have expired.",
        400,
      );
  }
  async hardDelete(id: string) {
    const result = await this.client
      .from("plans")
      .delete()
      .eq("id", id)
      .eq("user_id", this.owner)
      .not("deletion_scheduled_at", "is", null)
      .select("id")
      .maybeSingle();
    if (result.error || !result.data)
      throw new RepositoryError(
        "The deleted plan could not be permanently removed.",
        400,
      );
  }
}
