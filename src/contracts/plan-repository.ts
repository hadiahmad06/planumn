import type { Plan } from "@/domain/plan";

/**
 * Where plans are stored. Interface by Hadi's Claude; implementations (Supabase for signed-in users,
 * localStorage autosave for signed-out users) are owned by Michael's Codex (A16–A18).
 * Rows must keep the 2025 Supabase `plans` table shape (see src/domain/plan.ts) so 2025 plans load.
 */
export interface PlanRepository {
  /** All of the current user's plans, including soft-deleted ones, newest `last_updated` first. */
  list(): Promise<Plan[]>;
  get(id: string): Promise<Plan | null>;
  /** Insert (id null) or update. Returns the stored plan with server-owned fields filled in. */
  save(plan: Plan): Promise<Plan>;
  /** Schedule deletion 30 days out (server time). */
  softDelete(id: string): Promise<void>;
  recover(id: string): Promise<void>;
  hardDelete(id: string): Promise<void>;
}
