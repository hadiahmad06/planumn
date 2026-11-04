import { describe, expect, it } from "vitest";
import { catalogTextReadings, requirementsNotFull } from "./catalogTextReadings";
import type { CreditConstraint } from "./creditConstraints";
import { evaluateProgram, type CoursesRule, type Program, type Requirement, type Rule } from "./requirements";

// Hadi, 2026-11-04: count catalog-text readings, and say how many requirements aren't "full".
const text = (kind: CreditConstraint["kind"], credits: number, scope?: string): CreditConstraint => ({ kind, credits, scope, source: "text", sentence: "" });
const ee = { terms: [{ subjects: ["EE"], levels: [4, 5] }], exceptSubjects: [], exclude: [], include: [], forms: [], sentences: [] };
const list = (id: string, extra: Partial<CoursesRule> = {}): CoursesRule => ({
  kind: "courses",
  id,
  name: id,
  notes: null,
  choices: [{ options: [{ groupId: "1", courseId: 1, code: "EE 4111", title: null, credits: null }] }],
  minCourses: 1,
  minCredits: 0,
  ...extra,
});
const pattern: Rule = { kind: "text", id: "pat", name: "4xxx/5xxx EE", notes: null, text: "Additional 4xxx/5xxx EE courses.", pattern: ee };
const req = (id: string, rules: Rule[], constraints?: CreditConstraint[]): Requirement => ({ id, name: id, notes: null, rules, constraints });
const evaluate = (...requirements: Requirement[]) => evaluateProgram({ id: "any", name: "P", type: "Major", requirements } satisfies Program, [{ courseId: 1, credits: 4, code: "EE 4111" }]);

describe("catalogTextReadings (which requirements are full)", () => {
  it("counts 0 for a requirement with only structured data (full)", () => {
    const [r] = evaluate(req("core", [list("a")])).requirements;
    expect(catalogTextReadings(r)).toEqual({ count: 0, cantCheck: 0 });
  });

  it("counts a C2 reading as 1", () => {
    const [r] = evaluate(req("te", [list("a", { constraints: [text("total", 12)] })])).requirements;
    expect(catalogTextReadings(r)).toEqual({ count: 1, cantCheck: 0 });
  });

  it("counts a C2 reading plus a C3 pattern as 2, at any depth", () => {
    const group: Rule = { kind: "allOf", id: "g", name: "Technical Electives", notes: null, constraints: [text("total", 12)], children: [list("a"), pattern] };
    const [r] = evaluate(req("te", [group])).requirements;
    expect(catalogTextReadings(r)).toEqual({ count: 2, cantCheck: 0 });
  });

  it("counts a reading planu.mn can't check, and the requirement's own readings", () => {
    const [r] = evaluate(req("te", [list("a", { constraints: [text("min", 6, "Some list nobody names")] })], [text("total", 8)])).requirements;
    expect(r.rules[0].constraints?.[0].met).toBeNull();
    expect(catalogTextReadings(r)).toEqual({ count: 2, cantCheck: 1 });
  });

  it("leaves out a max reading it can check (it only caps a counted total), but not one it can't", () => {
    const [capped, unscoped] = evaluate(
      req("cap", [list("a", { constraints: [text("max", 4)] })]),
      req("bad", [list("b", { constraints: [text("max", 4, "Some list nobody names")] })]),
    ).requirements;
    expect(catalogTextReadings(capped).count).toBe(0);
    expect(catalogTextReadings(unscoped)).toEqual({ count: 1, cantCheck: 1 });
  });

  it("counts requirements, not readings, for a program", () => {
    const two: Rule = { kind: "allOf", id: "g", name: "g", notes: null, constraints: [text("total", 12), text("dept", 4, "EE")], children: [list("a"), pattern] };
    const result = evaluate(req("full", [list("x")]), req("three", [two]), req("one", [list("y", { constraints: [text("total", 8)] })]));
    expect(result.requirements.map((r) => catalogTextReadings(r).count)).toEqual([0, 3, 1]);
    expect(requirementsNotFull(result)).toEqual({ notFull: 2, total: 3 });
  });
});
