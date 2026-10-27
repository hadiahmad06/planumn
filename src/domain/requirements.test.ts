import { describe, expect, it } from "vitest";
import { evaluateProgram, evaluateRule, type CoursesRule, type Program, type Rule } from "./requirements";

const opt = (courseId: number | null, groupId = String(courseId)) => ({ groupId, courseId, code: null, title: null, credits: null });
const courses = (id: string, choices: (number | null)[][], minCourses: number, minCredits = 0): CoursesRule => ({
  kind: "courses",
  id,
  name: id,
  notes: null,
  choices: choices.map((ids) => ({ options: ids.map((i) => opt(i)) })),
  minCourses,
  minCredits,
});
const p = (courseId: number, credits = 4) => ({ courseId, credits });

describe("course rules", () => {
  it("counts each planned course once, and a choice accepts any of its options", () => {
    const rule = courses("intro", [[1, 2], [3]], 2);
    const r = evaluateRule(rule, [p(2)]);
    expect(r).toMatchObject({ satisfied: false, units: 1, filled: 0, coursesCount: 1, choiceMatches: [2, null] });
    expect(evaluateRule(rule, [p(2), p(3)])).toMatchObject({ satisfied: true, filled: 1 });
  });

  it("reassigns overlapping alternatives instead of taking the first match (review of #21)", () => {
    const rule = courses("overlap", [[1, 2], [1]], 2);
    expect(evaluateRule(rule, [p(1), p(2)])).toMatchObject({ satisfied: true, choiceMatches: [2, 1] });
    expect(evaluateRule(rule, [p(2), p(1)])).toMatchObject({ satisfied: true, choiceMatches: [2, 1] });
  });

  it("prefers the higher-credit alternative for credit minimums, regardless of plan order", () => {
    const rule = courses("calc", [[1, 2]], 0, 4);
    expect(evaluateRule(rule, [p(1, 2), p(2, 4)])).toMatchObject({ satisfied: true, credits: 4, choiceMatches: [2] });
  });

  it("finds the credit-valid assignment among overlapping alternatives (second review of #21)", () => {
    const rule = courses("credits", [[1, 2], [1, 3]], 2, 7);
    const planned = [p(1, 4), p(2, 1), p(3, 3)];
    expect(evaluateRule(rule, planned)).toMatchObject({ satisfied: true, credits: 7, coursesCount: 2 });
    expect(evaluateRule(rule, [...planned].reverse())).toMatchObject({ satisfied: true, credits: 7 });
  });

  it("checks credit minimums", () => {
    const rule = courses("cal", [[1], [2]], 0, 8);
    expect(evaluateRule(rule, [p(1, 4)]).satisfied).toBe(false);
    expect(evaluateRule(rule, [p(1, 4), p(2, 4)]).satisfied).toBe(true);
  });

  it("treats rules with nothing required as optional (0 units)", () => {
    expect(evaluateRule(courses("electives", [[1]], 0, 0), [])).toMatchObject({ units: 0, satisfied: true });
  });
});

describe("anyOf / allOf", () => {
  const anyOf: Rule = { kind: "anyOf", id: "a", name: "Discrete", notes: null, children: [courses("x", [[10]], 1), courses("y", [[11], [12]], 2)] };
  const allOf: Rule = { kind: "allOf", id: "b", name: "Core", notes: null, children: [courses("c1", [[20]], 1), courses("c2", [[21]], 1), anyOf] };

  it("anyOf is one unit, filled by any satisfied option", () => {
    expect(evaluateRule(anyOf, [p(11)])).toMatchObject({ satisfied: false, units: 1, filled: 0 });
    expect(evaluateRule(anyOf, [p(11), p(12)])).toMatchObject({ satisfied: true, filled: 1 });
  });

  it("allOf sums its children's units", () => {
    expect(evaluateRule(allOf, [p(20), p(10)])).toMatchObject({ satisfied: false, units: 3, filled: 2 });
    expect(evaluateRule(allOf, [p(20), p(21), p(10)])).toMatchObject({ satisfied: true, filled: 3 });
  });
});

describe("programs", () => {
  const program: Program = {
    id: "P",
    name: "Test B.S.",
    type: "Major",
    requirements: [
      { id: "r1", name: "Core", notes: null, rules: [courses("core", [[1], [2]], 2)] },
      { id: "r2", name: "Writing", notes: null, rules: [courses("wi", [[2], [3]], 1)] },
      { id: "r3", name: "Info only", notes: "see advisor", rules: [] },
    ],
  };

  it("lets one course count toward several requirements and skips empty ones", () => {
    const r = evaluateProgram(program, [p(1), p(2)]);
    expect(r.requirements).toHaveLength(2);
    expect(r.requirements.map((x) => x.satisfied)).toEqual([true, true]);
    expect(r).toMatchObject({ units: 2, filled: 2 });
    expect(r.requirements[1].courseIds).toEqual([2]);
  });

  it("ignores options that aren't in the catalog", () => {
    const rule = courses("new", [[null, 5]], 1);
    expect(evaluateRule(rule, [p(5)]).satisfied).toBe(true);
  });
});

describe("course matching vs brute force", () => {
  // Exhaustive best (count, credits) over all ways to assign distinct planned courses to choices.
  function best(choices: number[][], credits: Record<number, number>) {
    let top = { count: 0, credits: 0 };
    const go = (i: number, used: Set<number>, count: number, cr: number) => {
      if (count > top.count || (count === top.count && cr > top.credits)) top = { count, credits: cr };
      if (i === choices.length) return;
      go(i + 1, used, count, cr);
      for (const c of choices[i]) {
        if (used.has(c) || credits[c] === undefined) continue;
        used.add(c);
        go(i + 1, used, count + 1, cr + credits[c]);
        used.delete(c);
      }
    };
    go(0, new Set(), 0, 0);
    return top;
  }

  it("matches the optimum on 300 random small instances", () => {
    let seed = 7;
    const rand = (n: number) => ((seed = (seed * 1103515245 + 12345) % 2 ** 31), seed % n);
    for (let t = 0; t < 300; t++) {
      const choices = Array.from({ length: 1 + rand(4) }, () => [...new Set(Array.from({ length: 1 + rand(3) }, () => 1 + rand(5)))]);
      const credits: Record<number, number> = {};
      for (let c = 1; c <= 5; c++) if (rand(3)) credits[c] = 1 + rand(5);
      const planned = Object.entries(credits).map(([id, cr]) => p(Number(id), cr));
      const r = evaluateRule(courses("r", choices, 0), planned);
      expect({ count: r.coursesCount, credits: r.credits }).toEqual(best(choices, credits));
    }
  });
});
