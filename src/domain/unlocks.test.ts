import { describe, expect, it } from "vitest";
import { createEmptyPlan, type Plan } from "./plan";
import { addCourse } from "./planOps";
import { prerequisiteGraph, type UnlockCourse } from "./unlocks";

// Written by Ishaan's Claude (B22).
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
};
const plan = (): Plan => createEmptyPlan(new Date(2026, 3, 1)); // Fall 2026 = 1269

describe("prerequisiteGraph (B22)", () => {
  it("links courses to later courses that need them and finds the longest chain", () => {
    let p = addCourse(plan(), "1269", 1);
    p = addCourse(p, "1269", 4);
    p = addCourse(p, "1269", 6);
    p = addCourse(p, "1273", 2);
    p = addCourse(p, "1279", 3);
    p = addCourse(p, "1283", 5);
    const r = prerequisiteGraph(p, details);
    expect(r.unlocks.get(1)).toEqual([2]);
    expect(r.unlocks.get(4)).toEqual([3]);
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
    expect(r.unlocks.get(8)).toEqual([7]);
    expect(r.criticalPath).toEqual([8, 7]);
  });

  it("has no critical path without prerequisite links", () => {
    expect(prerequisiteGraph(addCourse(plan(), "1269", 6), details).criticalPath).toEqual([]);
  });
});
