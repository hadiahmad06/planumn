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
