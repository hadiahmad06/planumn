import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEmptyPlan, type Plan } from "@/domain/plan";
import { usePlanStore } from "@/features/plan-editor/store";
import { useSaveState } from "./saveState";
import { connectAutosave } from "./autosaveController";
import { AUTOSAVE_KEY, LocalPlanRepository } from "./localRepository";
import { isPlan } from "./validation";

let disconnect: (() => void) | undefined;
beforeEach(() => {
  vi.useFakeTimers();
  usePlanStore.setState({ plan: null, revision: 0 });
});
afterEach(() => {
  disconnect?.();
  disconnect = undefined;
  vi.useRealTimers();
});
function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  } as Storage;
}
describe("browser persistence", () => {
  it("loads 2025 browser autosaves and strips cloud ownership", async () => {
    const store = storage();
    store.setItem(
      "plan",
      JSON.stringify({
        ...createEmptyPlan(),
        id: "remote",
        user_id: "previous-owner",
      }),
    );
    const saved = await new LocalPlanRepository(store).get("autosave");
    expect(saved).toMatchObject({ id: null, user_id: null });
  });
  it("keeps corrupt data intact and reports quota failures", async () => {
    const store = storage();
    store.setItem(AUTOSAVE_KEY, "broken");
    const repo = new LocalPlanRepository(store);
    await expect(repo.get("autosave")).rejects.toThrow();
    expect(store.getItem(AUTOSAVE_KEY)).toBe("broken");
    store.setItem = () => {
      throw new Error("Quota exceeded");
    };
    await expect(repo.save(createEmptyPlan())).rejects.toThrow(
      "Quota exceeded",
    );
  });
  it("rejects malformed semesters and lock states before saving", () => {
    const plan = createEmptyPlan();
    expect(isPlan(plan)).toBe(true);
    expect(
      isPlan({ ...plan, semesters: [{ index: "1264", courses: [] }] }),
    ).toBe(false);
    expect(
      isPlan({
        ...plan,
        semesters: [{ index: "1269", courses: [{ id: 77, lock: "bogus" }] }],
      }),
    ).toBe(false);
  });
});
describe("autosave concurrency", () => {
  it("flushes edits before the debounce when leaving the editor", async () => {
    const repo = new LocalPlanRepository(storage());
    const save = vi.spyOn(repo, "save");
    disconnect = connectAutosave("owner", repo);
    usePlanStore.getState().loadPlan(createEmptyPlan());
    usePlanStore
      .getState()
      .edit((p) => ({ ...p, title: "Keep on navigation" }));
    disconnect();
    disconnect = undefined;
    await vi.advanceTimersByTimeAsync(0);
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Keep on navigation" }),
    );
  });
  it("flushes a previous plan's pending edits when another plan loads", async () => {
    const repo = new LocalPlanRepository(storage());
    const save = vi.spyOn(repo, "save");
    disconnect = connectAutosave("owner", repo);
    usePlanStore
      .getState()
      .loadPlan({ ...createEmptyPlan(), id: "first", user_id: "owner" });
    usePlanStore.getState().edit((p) => ({ ...p, title: "Keep first plan" }));
    usePlanStore
      .getState()
      .loadPlan({ ...createEmptyPlan(), id: "second", user_id: "owner" });
    await vi.advanceTimersByTimeAsync(0);
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ id: "first", title: "Keep first plan" }),
    );
    expect(usePlanStore.getState().plan?.id).toBe("second");
  });
  it("serializes edits during the initial insert and uses its assigned id for the next save", async () => {
    const plan = createEmptyPlan();
    let finish!: (p: Plan) => void;
    const repo = new LocalPlanRepository(storage());
    const save = vi
      .spyOn(repo, "save")
      .mockImplementationOnce(
        () =>
          new Promise<Plan>((resolve) => {
            finish = resolve;
          }),
      )
      .mockImplementation(async (p) => ({
        ...p,
        id: "assigned",
        user_id: "owner",
      }));
    disconnect = connectAutosave("owner", repo);
    usePlanStore.getState().loadPlan(plan);
    await vi.advanceTimersByTimeAsync(600);
    usePlanStore.getState().edit((p) => ({ ...p, title: "New title" }));
    expect(save).toHaveBeenCalledTimes(1);
    finish({ ...plan, id: "assigned", user_id: "owner" });
    await vi.advanceTimersByTimeAsync(0);
    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls[1][0]).toMatchObject({
      id: "assigned",
      title: "New title",
    });
    expect(usePlanStore.getState().plan).toMatchObject({
      id: "assigned",
      title: "New title",
    });
  });
  it("does not apply a completed save's metadata to a different loaded plan", async () => {
    let finish!: (p: Plan) => void;
    const first = createEmptyPlan();
    const repo = new LocalPlanRepository(storage());
    vi.spyOn(repo, "save").mockImplementationOnce(
      () =>
        new Promise<Plan>((resolve) => {
          finish = resolve;
        }),
    );
    disconnect = connectAutosave("owner", repo);
    usePlanStore.getState().loadPlan(first);
    await vi.advanceTimersByTimeAsync(600);
    const second = { ...createEmptyPlan(), id: "second", user_id: "owner" };
    usePlanStore.getState().loadPlan(second);
    finish({ ...first, id: "first", user_id: "owner" });
    await vi.advanceTimersByTimeAsync(0);
    expect(usePlanStore.getState().plan?.id).toBe("second");
  });
  it("surfaces a failed save and retains the unsaved plan", async () => {
    const repo = new LocalPlanRepository(storage());
    vi.spyOn(repo, "save").mockRejectedValue(new Error("Offline"));
    disconnect = connectAutosave("owner", repo);
    usePlanStore.getState().loadPlan(createEmptyPlan());
    await vi.advanceTimersByTimeAsync(600);
    expect(useSaveState.getState()).toMatchObject({
      status: "error",
      error: "Offline",
    });
    expect(usePlanStore.getState().plan).not.toBeNull();
  });
});
