"use client";

import { create } from "zustand";
import type { CourseId } from "@/domain/course";
import { normalizeSemesters, type LockState, type Plan } from "@/domain/plan";
import * as ops from "@/domain/planOps";
import type { Season, TermCode } from "@/domain/terms";

/**
 * The plan being edited. Owned by Hadi's Claude (plan editor).
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

/** Editor actions: thin wrappers over src/domain/planOps.ts. */
const edit = (fn: (plan: Plan) => Plan) => usePlanStore.getState().edit(fn);

export const planActions = {
  addCourse: (term: TermCode, id: CourseId, index?: number) => edit((p) => ops.addCourse(p, term, id, index)),
  removeCourse: (term: TermCode, id: CourseId) => edit((p) => ops.removeCourse(p, term, id)),
  moveCourse: (from: ops.CourseSlot, to: ops.CourseSlot) => edit((p) => ops.moveCourse(p, from, to)),
  setLock: (term: TermCode, id: CourseId, lock: LockState) => edit((p) => ops.setLock(p, term, id, lock)),
  setTitle: (title: string) => edit((p) => ops.setTitle(p, title)),
  addNextSemester: (skip: Season[] = []) => edit((p) => ops.addNextSemester(p, skip)),
  addSemester: (term: TermCode) => edit((p) => ops.addSemester(p, term)),
  addYearAtEnd: () => edit(ops.addYearAtEnd),
  addYearAtStart: () => edit(ops.addYearAtStart),
  removeSemester: (term: TermCode) => edit((p) => ops.removeSemester(p, term)),
  removeYear: (startYear: number) => edit((p) => ops.removeYear(p, startYear)),
};

export const usePlanStore = create<PlanStoreState>()((set) => ({
  plan: null,
  revision: 0,
  // Normalized on load so unsorted or duplicate 2025 terms can't break "add next semester" or drag ids.
  loadPlan: (plan) => set({ plan: { ...plan, semesters: normalizeSemesters(plan.semesters) }, revision: 0 }),
  patchMeta: (meta) => set((s) => (s.plan ? { plan: { ...s.plan, ...meta } } : s)),
  edit: (fn) =>
    set((s) => {
      if (!s.plan) return s;
      const next = fn(s.plan);
      if (next === s.plan) return s;
      return { plan: { ...next, last_updated: new Date().toISOString() }, revision: s.revision + 1 };
    }),
}));
