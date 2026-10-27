import { describe, expect, it } from "vitest";
import { createEmptyPlan, isPriorCredit, semesterKindLabel, type Plan } from "./plan";
import { addCourse, addPriorCredit, addYearAtStart, keepPriorFirst } from "./planOps";

// Written by Ishaan's Claude (B18 AP/IB/transfer credit).
const plan = (): Plan => createEmptyPlan(new Date(2026, 3, 1)); // Fall 2026 … Summer 2030
const prior = (p: Plan) => p.semesters.find(isPriorCredit);

describe("prior credit bucket (B18)", () => {
  it("adds one prior-credit term just before the plan, once", () => {
    const p = addPriorCredit(plan());
    expect(prior(p)).toEqual({ index: "1265", courses: [], kind: "prior" }); // Summer 2026, before Fall 2026
    expect(p.semesters[0]).toBe(prior(p));
    expect(addPriorCredit(p)).toBe(p);
    expect(semesterKindLabel("prior")).toMatch(/Prior credit/);
  });

  it("skips terms the plan already uses", () => {
    const base = plan();
    const withSummer: Plan = { ...base, semesters: [{ index: "1265", courses: [] }, ...base.semesters] };
    expect(prior(addPriorCredit(withSummer))?.index).toBe("1263"); // Spring 2026
  });

  it("stays before an earlier year added later, keeping its courses", () => {
    let p = addCourse(addPriorCredit(plan()), "1265", 87); // AP credit as MATH 1271-equivalent, say
    p = addYearAtStart(p); // adds 2025–26: Fall 2025, Spring 2026, Summer 2026 (taken by the bucket)
    const b = prior(p)!;
    expect(Number(b.index)).toBeLessThan(Number(p.semesters.find((s) => !isPriorCredit(s))!.index));
    expect(b.courses.map((c) => c.id)).toEqual([87]);
    expect(p.semesters.filter((s) => s.index === "1265")).toHaveLength(1);
  });

  it("leaves plans without a bucket alone", () => {
    const p = plan();
    expect(keepPriorFirst(p)).toBe(p);
  });
});

describe("move arrows and the prior-credit bucket (B18 + #59)", () => {
  it("never snaps into the bucket, and courses in the bucket get no arrow target", async () => {
    const { snapMove } = await import("./moveSnap");
    let p = addCourse(addPriorCredit(plan()), "1269", 7); // bucket = Summer 2026, course in Fall 2026
    p = addCourse(p, "1265", 8); // AP credit in the bucket
    expect(snapMove(p, "1269", 7, "earlier", undefined)).toBeNull(); // Summer 2026 is the bucket
    expect(snapMove(p, "1265", 8, "later", undefined)).toBeNull();
  });
});
