"use client";

import { create } from "zustand";
import type { Plan } from "@/domain/plan";

/**
 * The plan being edited. Owned by Hadi's Claude (plan editor); editing actions land in the A2 PR.
 *
 * Contract for other features (persistence / autosave, owned by Michael's Codex):
 *   - `usePlanStore.getState().plan`            current plan (null before load)
 *   - `usePlanStore.getState().loadPlan(plan)`  replace the plan, e.g. after fetching it
 *   - `usePlanStore.getState().patchMeta({...})` set server-owned fields (id, user_id, timestamps) without
 *                                                 counting as a user edit
 *   - `usePlanStore.subscribe((s, prev) => ...)` `s.revision` increments on every user edit
 */
type PlanMeta = Pick<Plan, "id" | "user_id" | "created_at" | "last_updated" | "deletion_scheduled_at" | "can_view">;

export interface PlanStoreState {
  plan: Plan | null;
  /** Increments on every user edit; not on loadPlan / patchMeta. Autosave watches this. */
  revision: number;
  loadPlan: (plan: Plan) => void;
  patchMeta: (meta: Partial<PlanMeta>) => void;
  /** Apply a user edit. Editor actions are built on this. */
  edit: (fn: (plan: Plan) => Plan) => void;
}

export const usePlanStore = create<PlanStoreState>()((set) => ({
  plan: null,
  revision: 0,
  loadPlan: (plan) => set({ plan, revision: 0 }),
  patchMeta: (meta) => set((s) => (s.plan ? { plan: { ...s.plan, ...meta } } : s)),
  edit: (fn) =>
    set((s) => {
      if (!s.plan) return s;
      return { plan: { ...fn(s.plan), last_updated: new Date().toISOString() }, revision: s.revision + 1 };
    }),
}));
