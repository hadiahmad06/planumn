import { describe, expect, it } from "vitest";
import { createEmptyPlan } from "@/domain/plan";
import { comparePlans, duplicatePlan } from "./compare";

describe("plan comparison and what-if copies", () => {
  it("distinguishes lock changes, other-term appearances and unmatched entries without mutating plans", () => {
    const left = createEmptyPlan(),
      right = createEmptyPlan();
    left.semesters = [
      {
        index: "1269",
        courses: [
          { id: 1, lock: "locked" },
          { id: 2, lock: "unlocked" },
          { id: 3, lock: "unlocked" },
        ],
      },
    ];
    right.semesters = [
      {
        index: "1269",
        courses: [
          { id: 1, lock: "unlocked" },
          { id: 4, lock: "unlocked" },
        ],
      },
      { index: "1273", courses: [{ id: 2, lock: "locked" }] },
    ];
    const before = JSON.stringify([left, right]);
    const rows = comparePlans(left, right);
    expect(rows[0].left.map((course) => course.difference)).toEqual([
      "lock-changed",
      "different-term",
      "only-here",
    ]);
    expect(rows[0].right.map((course) => course.difference)).toEqual([
      "lock-changed",
      "only-here",
    ]);
    expect(rows[1].right[0].difference).toBe("different-term");
    expect(rows[1].leftPresent).toBe(false);
    expect(rows[1].rightPresent).toBe(true);
    expect(JSON.stringify([left, right])).toBe(before);
  });
  it("pairs exact locks first and preserves duplicate entries/repeated term rows from older plans", () => {
    const left = createEmptyPlan(),
      right = createEmptyPlan();
    left.semesters = [
      {
        index: "1269",
        courses: [
          { id: 1, lock: "locked" },
          { id: 1, lock: "unlocked" },
        ],
      },
      { index: "1269", courses: [{ id: 1, lock: "unlocked" }] },
    ];
    right.semesters = [
      { index: "1269", courses: [{ id: 1, lock: "unlocked" }] },
    ];
    expect(
      comparePlans(left, right)[0].left.map((course) => course.difference),
    ).toEqual(["only-here", "same", "only-here"]);
    expect(comparePlans(right, right)[0].right[0].difference).toBe("same");
    expect(left.semesters).toHaveLength(2);
  });
  it("duplicates data deeply but resets ownership, access, identity and deletion state", () => {
    const source = createEmptyPlan(new Date("2020-01-01"));
    source.id = "source-id";
    source.user_id = "source-owner";
    source.can_view = ["viewer"];
    source.deletion_scheduled_at = "2030-01-01T00:00:00Z";
    source.title = "x".repeat(300);
    source.semesters[0].courses = [{ id: 77, lock: "locked" }];
    const copy = duplicatePlan(source, new Date("2026-10-26"));
    expect(copy).toMatchObject({
      id: null,
      user_id: null,
      can_view: [],
      deletion_scheduled_at: null,
      created_at: "2026-10-26T00:00:00.000Z",
      last_updated: "2026-10-26T00:00:00.000Z",
    });
    expect(copy.title).toHaveLength(297);
    expect(copy.title).toContain("(copy)");
    copy.semesters[0].courses.pop();
    expect(source.semesters[0].courses).toHaveLength(1);
    expect(source.id).toBe("source-id");
  });
});

// Written by Michael's Codex. Regression coverage for post-B13 plan-shape additions.
describe("placeholder and special-semester comparison", () => {
  it("compares slot contents, edits and duplicate counts without changing either plan", () => {
    const left = createEmptyPlan(),
      right = createEmptyPlan();
    left.semesters = [
      {
        index: "1269",
        courses: [],
        placeholders: [
          { key: "left", label: "Elective", credits: 3, libEd: "GP" },
          { key: "edit", label: "Research", credits: 2 },
          { key: "extra", label: "Elective", credits: 3, libEd: "GP" },
        ],
      },
    ];
    right.semesters = [
      {
        index: "1269",
        courses: [],
        placeholders: [
          { key: "different-key", label: "Elective", credits: 3, libEd: "GP" },
          { key: "edit", label: "Research", credits: 4 },
        ],
      },
    ];
    const before = JSON.stringify([left, right]);
    const term = comparePlans(left, right)[0];
    expect(term.leftSlots.map((p) => p.difference)).toEqual([
      "same",
      "changed",
      "only-here",
    ]);
    expect(term.rightSlots.map((p) => p.difference)).toEqual([
      "same",
      "changed",
    ]);
    expect(JSON.stringify([left, right])).toBe(before);
  });
  it("aligns prior credit by kind rather than its synthetic date and exposes semester kinds", () => {
    const left = createEmptyPlan(),
      right = createEmptyPlan();
    left.semesters = [
      {
        index: "1255",
        kind: "prior",
        courses: [{ id: 77, lock: "locked" }],
        placeholders: [{ key: "a", label: "AP credit", credits: 3 }],
      },
      { index: "1269", kind: "leave", courses: [] },
    ];
    right.semesters = [
      {
        index: "1265",
        kind: "prior",
        courses: [{ id: 77, lock: "locked" }],
        placeholders: [{ key: "b", label: "AP credit", credits: 3 }],
      },
      { index: "1269", kind: "abroad", courses: [] },
    ];
    const terms = comparePlans(left, right);
    expect(terms).toHaveLength(2);
    expect(terms[0]).toMatchObject({
      key: "prior",
      leftKind: "prior",
      rightKind: "prior",
    });
    expect(terms[0].left[0].difference).toBe("same");
    expect(terms[0].leftSlots[0].difference).toBe("same");
    expect(terms[1]).toMatchObject({ leftKind: "leave", rightKind: "abroad" });
  });
  it("keeps Lib Ed differences visible and flags slot appearances in other terms", () => {
    const left = createEmptyPlan(),
      right = createEmptyPlan();
    left.semesters = [
      {
        index: "1269",
        courses: [],
        placeholders: [
          { key: "tag", label: "Elective", credits: 3, libEd: "GP" },
          { key: "move", label: "Research", credits: 2 },
        ],
      },
    ];
    right.semesters = [
      {
        index: "1269",
        courses: [],
        placeholders: [
          { key: "tag", label: "Elective", credits: 3, libEd: "WI" },
        ],
      },
      {
        index: "1273",
        courses: [],
        placeholders: [{ key: "other", label: "Research", credits: 2 }],
      },
    ];
    expect(
      comparePlans(left, right)[0].leftSlots.map((p) => p.difference),
    ).toEqual(["changed", "different-term"]);
    const copy = duplicatePlan(left);
    copy.semesters[0].kind = "coop";
    copy.semesters[0].placeholders![0].credits = 9;
    expect(left.semesters[0].kind).toBeUndefined();
    expect(left.semesters[0].placeholders![0].credits).toBe(3);
  });
});
