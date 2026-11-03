"use client";
import type { PlanRepository } from "@/contracts/plan-repository";
import type { Plan } from "@/domain/plan";
import { usePlanStore } from "@/features/plan-editor/store";
import { useSaveState } from "./saveState";
/** Written by Michael's Codex. Serialized saves with a generation per loaded plan. */
export function connectAutosave(owner: string | null, repo: PlanRepository) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let generation = 0;
  let alive = true;
  let busy = false;
  let queued = false;
  let applyingMeta = false;
  let inFlight: Promise<Plan> | null = null;
  let flightGeneration = -1;
  function finishSnapshot(plan: Plan | null, epoch: number) {
    if (!plan || (plan.user_id && plan.user_id !== owner)) return;
    const pending = inFlight;
    const sameInsert = flightGeneration === epoch;
    void (async () => {
      let finalPlan = plan;
      if (pending) {
        try {
          const saved = await pending;
          if (sameInsert && !finalPlan.id)
            finalPlan = { ...finalPlan, id: saved.id, user_id: saved.user_id };
        } catch {
          /* Retry the complete latest snapshot below. */
        }
      }
      try {
        await repo.save(finalPlan);
      } catch {
        useSaveState.setState({
          status: "error",
          error:
            "The last plan's changes could not be saved. Reopen it before closing this tab.",
        });
      }
    })();
  }
  useSaveState.setState({
    status: "idle",
    savedAt: null,
    local: !owner,
    error: null,
  });
  async function flush() {
    if (busy) {
      queued = true;
      return;
    }
    const { plan } = usePlanStore.getState();
    if (
      !plan ||
      (plan.user_id && plan.user_id !== owner) ||
      plan.deletion_scheduled_at
    )
      return;
    busy = true;
    queued = false;
    const current = generation;
    useSaveState.setState({ status: "saving", error: null });
    try {
      flightGeneration = current;
      inFlight = repo.save(plan);
      const saved = await inFlight;
      if (alive && current === generation) {
        applyingMeta = true;
        usePlanStore.getState().patchMeta({
          id: saved.id,
          user_id: saved.user_id,
          created_at: saved.created_at,
          last_updated: saved.last_updated,
        });
        applyingMeta = false;
        useSaveState.setState({
          status: queued ? "pending" : "saved",
          savedAt: saved.last_updated,
        });
      }
    } catch (error) {
      if (alive && current === generation)
        useSaveState.setState({
          status: "error",
          error:
            error instanceof Error
              ? error.message
              : "Saving failed. Keep this page open and retry.",
        });
    } finally {
      busy = false;
      inFlight = null;
      if (alive && queued) {
        queued = false;
        void flush();
      }
    }
  }
  function schedule() {
    clearTimeout(timer);
    if (busy) {
      queued = true;
      useSaveState.setState({ status: "pending" });
      return;
    }
    if (!owner) {
      void flush();
      return;
    }
    useSaveState.setState({ status: "pending" });
    timer = setTimeout(() => void flush(), 600);
  }
  useSaveState.setState({ retry: () => void flush() });
  const unsubscribe = usePlanStore.subscribe((state, previous) => {
    if (applyingMeta || !state.plan) return;
    if (
      state.revision === 0 &&
      (previous.revision !== 0 ||
        state.plan.semesters !== previous.plan?.semesters)
    ) {
      if (
        ["pending", "error"].includes(useSaveState.getState().status) ||
        queued
      )
        finishSnapshot(previous.plan, generation);
      generation++;
      clearTimeout(timer);
      queued = false;
      useSaveState.setState({
        status: "idle",
        savedAt: state.plan.last_updated,
        error: null,
      });
      if (!state.plan.id) schedule();
    } else if (state.revision !== previous.revision) schedule();
  });
  // Auth may settle after the editor has already loaded its initial plan.
  if (usePlanStore.getState().plan && !usePlanStore.getState().plan?.id)
    schedule();
  return () => {
    if (["pending", "error"].includes(useSaveState.getState().status) || queued)
      finishSnapshot(usePlanStore.getState().plan, generation);
    alive = false;
    generation++;
    clearTimeout(timer);
    unsubscribe();
  };
}
