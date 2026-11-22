import type { Plan } from "@/domain/plan";
import type { PlanRepository } from "@/contracts/plan-repository";
import { isPlan, normalizePlan } from "./validation";
export const AUTOSAVE_KEY = "planumn:autosave:v1";
/** Written by Michael's Codex. Storage failures propagate; never claim a failed save succeeded. */
export class LocalPlanRepository implements PlanRepository {
  constructor(private storage: Storage) {}
  async list() {
    const plan = await this.get("autosave");
    return plan ? [plan] : [];
  }
  async get(_id: string): Promise<Plan | null> {
    void _id;
    const raw =
      this.storage.getItem(AUTOSAVE_KEY) ?? this.storage.getItem("plan");
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    // A1 (Hadi's Claude): 2025's "plan" key gets the same row rules as the cloud, and the
    // ownership fields are set before checking, so a 2025 autosave written before
    // `deletion_scheduled_at` existed (June 2025) still opens. Storage is untouched until a save.
    const plan =
      parsed && typeof parsed === "object"
        ? {
            ...normalizePlan(parsed as Plan),
            id: null,
            user_id: null,
            can_view: [],
            deletion_scheduled_at: null,
          }
        : parsed;
    if (!isPlan(plan))
      throw new Error(
        "This browser's autosave could not be read. Your stored copy has been kept.",
      );
    return plan;
  }
  async save(plan: Plan): Promise<Plan> {
    const local = {
      ...plan,
      id: null,
      user_id: null,
      can_view: [],
      deletion_scheduled_at: null,
      last_updated: new Date().toISOString(),
    };
    if (!isPlan(local)) throw new Error("The plan could not be saved.");
    this.storage.setItem(AUTOSAVE_KEY, JSON.stringify(local));
    return local;
  }
  async softDelete() {
    this.storage.removeItem(AUTOSAVE_KEY);
    this.storage.removeItem("plan");
  }
  async recover() {
    throw new Error("Browser autosaves do not have a recycle bin.");
  }
  async hardDelete() {
    await this.softDelete();
  }
}
