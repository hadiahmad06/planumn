import { describe, expect, it } from "vitest";
import { rankMinors } from "./minors";
import type { CoursesRule, Program } from "./requirements";

// Written by Ishaan's Claude (B14 minor finder).
const opt = (courseId: number) => ({ groupId: String(courseId), courseId, code: `X ${courseId}`, title: null, credits: { min: 3, max: 3 } });
const rule = (id: string, ids: number[], minCourses: number): CoursesRule => ({
  id,
  name: id,
  notes: null,
  kind: "courses",
  choices: ids.map((c) => ({ options: [opt(c)] })),
  minCourses,
  minCredits: 0,
});
const minor = (id: string, name: string, rules: CoursesRule[]): Program => ({
  id,
  name,
  type: "Minor",
  requirements: rules.map((r) => ({ id: `${id}-${r.id}`, name: r.name, notes: null, rules: [r] })),
});
const planned = (ids: number[]) => ids.map((courseId) => ({ courseId, credits: 3 }));

describe("rankMinors (B14)", () => {
  const math = minor("MATHMIN", "Mathematics Minor", [rule("core", [1, 2], 2), rule("electives", [3, 4, 5], 2)]);
  const stat = minor("STATMIN", "Statistics Minor", [rule("core", [1, 9], 2)]);
  const art = minor("ARTMIN", "Art Minor", [rule("core", [20, 21], 1)]);

  it("ranks by planned courses that count, then by requirements met, and drops minors with none", () => {
    const fits = rankMinors([stat, math, art], planned([1, 2, 3]));
    expect(fits.map((f) => [f.id, f.matched.length, `${f.filled}/${f.units}`])).toEqual([
      ["MATHMIN", 3, "1/2"],
      ["STATMIN", 1, "0/1"],
    ]);
  });

  it("skips minors already in the plan", () => {
    expect(rankMinors([math, stat], planned([1, 2]), new Set(["MATHMIN"])).map((f) => f.id)).toEqual(["STATMIN"]);
  });

  it("returns nothing for an empty plan", () => {
    expect(rankMinors([math, stat, art], [])).toEqual([]);
  });
});
