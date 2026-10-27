"use client";

import { create } from "zustand";
import type { CourseId } from "@/domain/course";
import type { LockState, Plan } from "@/domain/plan";
import * as ops from "@/domain/planOps";
import { usePreviewStore } from "@/features/preview/store";
import { useDisplaySettings } from "./displaySettings";
import { seasonOf, type TermCode } from "@/domain/terms";

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
  moveCourseToTerm: (from: TermCode, id: CourseId, to: TermCode) => edit((p) => ops.moveCourseToTerm(p, from, id, to)),
  setLock: (term: TermCode, id: CourseId, lock: LockState) => edit((p) => ops.setLock(p, term, id, lock)),
  setTitle: (title: string) => edit((p) => ops.setTitle(p, title)),
  addProgram: (id: string) => edit((p) => ops.setPrograms(p, [...p.programs, id])),
  removeProgram: (id: string) => edit((p) => ops.setPrograms(p, p.programs.filter((x) => x !== id))),
  addNextSemester: () => edit(ops.addNextSemester),
  addSemester: (term: TermCode) => edit((p) => ops.addSemester(p, term)),
  addYearAtEnd: () => edit(ops.addYearAtEnd),
  addYearAtStart: () => edit(ops.addYearAtStart),
  removeSemester: (term: TermCode) => edit((p) => ops.removeSemester(p, term)),
  removeYear: (startYear: number) => edit((p) => ops.removeYear(p, startYear)),
};

export const usePlanStore = create<PlanStoreState>()((set) => ({
  plan: null,
  revision: 0,
  loadPlan: (plan) => set({ plan, revision: 0 }),
  patchMeta: (meta) => set((s) => (s.plan ? { plan: { ...s.plan, ...meta } } : s)),
  edit: (fn) =>
    set((s) => {
      if (!s.plan) return s;
      const next = fn(s.plan);
      if (next === s.plan) return s;
      return { plan: { ...next, last_updated: new Date().toISOString() }, revision: s.revision + 1 };
    }),
}));

/** Editor UI state that isn't part of the plan. */
interface EditorUiState {
  /** Semester picked by clicking its header (A30): Enter in search adds there. */
  selectedTerm: TermCode | null;
  selectTerm: (term: TermCode | null) => void;
  /** True while a course is being dragged; hover previews are suppressed then. */
  dragging: boolean;
}

export const useEditorUi = create<EditorUiState>()((set) => ({
  selectedTerm: null,
  selectTerm: (selectedTerm) => set({ selectedTerm }),
  dragging: false,
}));

/** Hover preview that stays quiet during drags (otherwise every card you drag across pops a panel). */
export function hoverCourse(id: CourseId | null) {
  if (id !== null && useEditorUi.getState().dragging) return;
  usePreviewStore.getState().hoverPreview(id);
}

// Keep the selected semester valid (review of #22): clear it when another plan loads (revision
// resets to 0) or when the selected semester is removed from the plan.
usePlanStore.subscribe((state, previous) => {
  const selected = useEditorUi.getState().selectedTerm;
  if (!selected || state.plan === previous.plan) return;
  // patchMeta (e.g. autosave assigning an id) keeps the semesters array; a newly loaded plan doesn't.
  const loaded = state.revision === 0 && state.plan?.semesters !== previous.plan?.semesters;
  if (loaded || !state.plan?.semesters.some((s) => s.index === selected)) useEditorUi.getState().selectTerm(null);
});

// A selected semester whose season gets hidden can't be seen, so stop targeting it (review of #22).
useDisplaySettings.subscribe((state) => {
  const selected = useEditorUi.getState().selectedTerm;
  if (selected && state.hiddenSeasons.includes(seasonOf(selected))) useEditorUi.getState().selectTerm(null);
});
