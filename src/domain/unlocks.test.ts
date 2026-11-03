import { describe, expect, it } from "vitest";
import { createEmptyPlan, type Plan } from "./plan";
import { addCourse } from "./planOps";
import { firstPlannedTerms, prerequisiteGraph, type UnlockCourse } from "./unlocks";

// Written by Ishaan's Claude (B22). "Or" regressions by Hadi's Claude.
const c = (id: number, code: string, prereqText: string | null): UnlockCourse => ({ id, code, dept: code.split(" ")[0], prereqText });
const details = {
  1: c(1, "CSCI 1133", null),
  2: c(2, "CSCI 1933", "CSCI 1133"),
  3: c(3, "CSCI 2041", "CSCI 1933 and CSCI 2011"),
  4: c(4, "CSCI 2011", null),
  5: c(5, "CSCI 4041", "CSCI 2041"),
  6: c(6, "MUS 1014", null),
  7: c(7, "STAT 3022", "STAT 3021"),
  8: c(8, "STAT 3021H", null),
  // "Or" cases (Michael's Codex's review of #74).
  10: c(10, "CSCI 1913", null),
  11: c(11, "CSCI 1933", "CSCI 1133 or CSCI 1913"),
  12: c(12, "CSCI 2041", "CSCI 1933"),
  13: c(13, "CSCI 1933", "CSCI 1133 or instructor consent"),
  14: c(14, "CSCI 4061", "(CSCI 1913 and CSCI 2011) or CSCI 1933"),
  15: c(15, "CSCI 1133H", null),
};
const plan = (): Plan => createEmptyPlan(new Date(2026, 3, 1)); // Fall 2026 = 1269
const req = (...ids: number[]) => ids.map((id) => ({ id, required: true }));

describe("prerequisiteGraph (B22)", () => {
  it("links courses to later courses that need them and finds the longest chain", () => {
    let p = addCourse(plan(), "1269", 1);
    p = addCourse(p, "1269", 4);
    p = addCourse(p, "1269", 6);
    p = addCourse(p, "1273", 2);
    p = addCourse(p, "1279", 3);
    p = addCourse(p, "1283", 5);
    const r = prerequisiteGraph(p, details);
    expect(r.unlocks.get(1)).toEqual(req(2));
    expect(r.unlocks.get(4)).toEqual(req(3));
    expect(r.unlocks.get(6)).toEqual([]);
    expect(r.criticalPath).toEqual([1, 2, 3, 5]);
  });

  it("only counts prerequisites planned earlier, and honors versions count", () => {
    let p = addCourse(plan(), "1269", 2); // CSCI 1933 before CSCI 1133: no edge
    p = addCourse(p, "1273", 1);
    p = addCourse(p, "1269", 8); // STAT 3021H unlocks STAT 3022
    p = addCourse(p, "1273", 7);
    const r = prerequisiteGraph(p, details);
    expect(r.unlocks.get(1)).toEqual([]);
    expect(r.unlocks.get(8)).toEqual(req(7));
    expect(r.criticalPath).toEqual([8, 7]);
  });

  it("has no critical path without prerequisite links", () => {
    expect(prerequisiteGraph(addCourse(plan(), "1269", 6), details).criticalPath).toEqual([]);
  });
});

describe("prerequisiteGraph: 'or' alternatives", () => {
  it("doesn't call either option required when both are planned (CSCI 1133 or CSCI 1913)", () => {
    let p = addCourse(plan(), "1269", 1);
    p = addCourse(p, "1269", 10);
    p = addCourse(p, "1273", 11);
    p = addCourse(p, "1279", 12);
    const r = prerequisiteGraph(p, details);
    expect(r.unlocks.get(1)).toEqual([{ id: 11, required: false }]);
    expect(r.unlocks.get(10)).toEqual([{ id: 11, required: false }]);
    // Delaying 1133 alone doesn't delay 1933, so neither starts the chain.
    expect(r.criticalPath).toEqual([11, 12]);
  });

  it("calls the only planned option required", () => {
    let p = addCourse(plan(), "1269", 1);
    p = addCourse(p, "1273", 11);
    p = addCourse(p, "1279", 12);
    const r = prerequisiteGraph(p, details);
    expect(r.unlocks.get(1)).toEqual(req(11));
    expect(r.criticalPath).toEqual([1, 11, 12]);
  });

  it("an option planned in the same term or later isn't an alternative yet", () => {
    let p = addCourse(plan(), "1269", 1);
    p = addCourse(p, "1273", 11);
    p = addCourse(p, "1273", 10); // CSCI 1913 alongside CSCI 1933: too late to count
    const r = prerequisiteGraph(p, details);
    expect(r.unlocks.get(1)).toEqual(req(11));
    expect(r.unlocks.get(10)).toEqual([]);
  });

  it("non-course text ('or instructor consent') isn't a planned alternative", () => {
    let p = addCourse(plan(), "1269", 1);
    p = addCourse(p, "1273", 13);
    expect(prerequisiteGraph(p, details).unlocks.get(1)).toEqual(req(13));
  });

  it("an 'or' branch counts as an alternative only when all of it is planned", () => {
    // (CSCI 1913 and CSCI 2011) or CSCI 1933, without 2011: only 1933 meets it.
    let p = addCourse(plan(), "1269", 10);
    p = addCourse(p, "1269", 2);
    p = addCourse(p, "1273", 14);
    let r = prerequisiteGraph(p, details);
    expect(r.unlocks.get(10)).toEqual([{ id: 14, required: false }]);
    expect(r.unlocks.get(2)).toEqual(req(14));
    expect(r.criticalPath).toEqual([2, 14]);
    // With 2011 planned too, both branches are met and nothing is required.
    p = addCourse(p, "1269", 4);
    r = prerequisiteGraph(p, details);
    expect(r.unlocks.get(2)).toEqual([{ id: 14, required: false }]);
    expect(r.unlocks.get(4)).toEqual([{ id: 14, required: false }]);
    expect(r.criticalPath).toEqual([]);
  });

  it("an honors version planned earlier is an alternative to the base course", () => {
    let p = addCourse(plan(), "1269", 1);
    p = addCourse(p, "1269", 15); // CSCI 1133H also meets "CSCI 1133"
    p = addCourse(p, "1273", 2);
    const r = prerequisiteGraph(p, details);
    expect(r.unlocks.get(1)).toEqual([{ id: 2, required: false }]);
    expect(r.unlocks.get(15)).toEqual([{ id: 2, required: false }]);
    expect(r.criticalPath).toEqual([]);
  });
});

// Backlog after #86: PrereqChain took a retaken course's first term in stored order, not term order.
describe("firstPlannedTerms", () => {
  it("gives each course its earliest term even when semesters are stored out of order", () => {
    let p = addCourse(plan(), "1269", 1);
    p = addCourse(p, "1273", 1); // retake in Spring 2027
    p = addCourse(p, "1273", 2);
    const reversed: Plan = { ...p, semesters: [...p.semesters].reverse() };
    const terms = firstPlannedTerms(reversed);
    expect(terms.get(1)).toBe("1269");
    expect(terms.get(2)).toBe("1273");
  });
});
