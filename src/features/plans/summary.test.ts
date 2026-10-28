import { describe, expect, it } from "vitest";
import { createEmptyPlan } from "@/domain/plan";
import { planListSummary } from "./summary";

describe("My Plans scheduled credit summaries", () => {
  it("counts prior-credit placeholders even without catalog courses", () => {
    const plan = createEmptyPlan();
    plan.semesters = [
      {
        index: "1265",
        kind: "prior",
        courses: [],
        placeholders: [
          { key: "ap", label: "AP exam credit", credits: 4 },
          { key: "transfer", label: "Transfer credit", credits: 3.5 },
        ],
      },
    ];
    const before = structuredClone(plan);
    expect(planListSummary(plan, {})).toEqual({
      courseEntries: 0,
      placeholderSlots: 2,
      minimumCredits: 7.5,
      creditsReady: true,
    });
    expect(plan).toEqual(before);
  });
  it("adds catalog minimums, placeholder credits and repeated course entries", () => {
    const plan = createEmptyPlan();
    plan.semesters = [
      {
        index: "1269",
        courses: [{ id: 1, lock: "locked" }],
        placeholders: [{ key: "research", label: "Research", credits: 2 }],
      },
      { index: "1273", kind: "abroad", courses: [{ id: 1, lock: "unlocked" }] },
    ];
    expect(
      planListSummary(plan, {
        1: {
          id: 1,
          dept: "CSCI",
          number: "5994",
          title: "Research",
          credits: { min: 1, max: 4 },
        },
      }),
    ).toEqual({
      courseEntries: 2,
      placeholderSlots: 1,
      minimumCredits: 4,
      creditsReady: true,
    });
  });
  it("retains the loading guard for unknown catalog credits and supports 2025 rows without slots", () => {
    const plan = createEmptyPlan();
    plan.semesters = [
      { index: "1269", courses: [{ id: 77, lock: "unlocked" }] },
    ];
    expect(planListSummary(plan, {})).toEqual({
      courseEntries: 1,
      placeholderSlots: 0,
      minimumCredits: 0,
      creditsReady: false,
    });
    expect(planListSummary(createEmptyPlan(), {}).creditsReady).toBe(true);
  });
});
