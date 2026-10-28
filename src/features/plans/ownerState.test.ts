import { describe, expect, it } from "vitest";
import { createEmptyPlan } from "@/domain/plan";
import {
  updatePlanList,
  visiblePlanList,
  type OwnedPlanListView,
} from "./ownerState";
const plan = (owner: string) => ({
  ...createEmptyPlan(),
  id: `${owner}-plan`,
  user_id: owner,
  title: `${owner}'s private title`,
});
const first: OwnedPlanListView = {
  owner: "first",
  plans: [plan("first")],
  error: "first's request failed",
  busy: true,
  confirm: { title: "Delete first's private plan?", run: async () => {} },
};

describe("account-scoped My Plans state", () => {
  it("hides all previous-account rows, errors, busy state and confirmation titles immediately", () => {
    for (const owner of [null, "second"]) {
      expect(visiblePlanList(first, owner)).toEqual({
        plans: null,
        error: "",
        busy: false,
        confirm: null,
      });
    }
    expect(visiblePlanList(first, "first").plans?.[0].title).toBe(
      "first's private title",
    );
  });
  it("ignores a late request or mutation update after the active account changes", () => {
    const second = updatePlanList(first, "second", "second", {
      plans: [plan("second")],
    })!;
    expect(
      updatePlanList(second, "first", "second", {
        plans: first.plans,
        error: first.error,
        confirm: first.confirm,
      }),
    ).toBe(second);
    expect(updatePlanList(second, "first", null, { plans: first.plans })).toBe(
      second,
    );
    expect(updatePlanList(second, null, null, { plans: first.plans })).toBe(
      second,
    );
  });
  it("starts a new owner's successful or failed load with empty previous-account UI", () => {
    const loaded = updatePlanList(first, "second", "second", {
      plans: [plan("second")],
    })!;
    expect(visiblePlanList(loaded, "second")).toMatchObject({
      error: "",
      busy: false,
      confirm: null,
    });
    const failed = updatePlanList(first, "second", "second", {
      error: "Load failed",
    })!;
    expect(visiblePlanList(failed, "second")).toEqual({
      owner: "second",
      plans: null,
      error: "Load failed",
      busy: false,
      confirm: null,
    });
  });
  it("does not relabel mixed-owner response data as belonging to the current account", () => {
    const mixed = { ...first, plans: [plan("first"), plan("second")] };
    expect(
      visiblePlanList(mixed, "first").plans?.map((p) => p.user_id),
    ).toEqual(["first"]);
    expect(mixed.plans).toHaveLength(2);
  });
});
