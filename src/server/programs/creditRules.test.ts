import { describe, expect, it } from "vitest";
import { evaluateProgram, type CoursesRule, type GroupRule } from "@/domain/requirements";
import { normalizeProgram, type RawProgram } from "./normalize";

// Phase C/C2. Shapes from CourseDog (CS B.S. technical electives, Aerospace B.A.E.M., Cognitive Science minor), trimmed.
const ids = (...v: string[]) => ({ condition: "courses", values: v.map((id) => ({ value: [id], logic: "or" })) });
const raw = {
  programGroupId: "P",
  requisites: {
    a: [
      {
        id: "g1",
        name: "Technical Electives",
        notes: "<p>Take 12 credits from the lists below.</p>",
        rules: [
          {
            id: "te",
            name: "Technical Electives",
            condition: "allOf",
            description: "<p>Must total 23 credits minimum. Of the 23 credits, 11 must have a CSCI designator.</p>",
            subRules: [{ id: "list", name: "Upper division CSCI", condition: "minimumCredits", minCredits: 0, value: ids("1", "2", "3") }],
          },
          { id: "dup", name: "Electives", condition: "minimumCredits", minCredits: 9, description: "Take 9 or more credits from the following:", value: ids("1") },
          { id: "cap", name: "Capped", condition: "minimumCredits", minCredits: 6, maxCredits: 12, description: "Students may take up to 12 credits total from this list.", value: ids("2") },
          { id: "all", name: "Required Courses", condition: "completedAllOf", value: ids("1", "2") },
          { id: "any", name: "Cognitive Science", condition: "completedAnyOf", credits: 2, value: ids("3") },
          { id: "atleast", name: "Fluids Technical Electives", condition: "completedAtLeastXOf", restriction: 0, minCourses: 0, value: ids("2") },
        ],
      },
    ],
  },
} as unknown as RawProgram;

const resolve = (groupId: string) => ({ groupId, courseId: Number(groupId), code: groupId === "3" ? "MATH 4242" : `CSCI 40${groupId}1`, title: null, credits: null });
const program = normalizeProgram(raw, resolve);
const rules = program.requirements[0].rules;
const rule = (id: string) => rules.find((r) => r.id === id)!;

describe("credit constraints in the normalizer (C2)", () => {
  it("attaches constraints read from rule descriptions and requirement notes", () => {
    expect(rule("te").constraints?.map((c) => [c.kind, c.credits, c.scope, c.source])).toEqual([
      ["total", 23, undefined, "text"],
      ["dept", 11, "CSCI", "text"],
    ]);
    expect(program.requirements[0].constraints?.map((c) => [c.kind, c.credits])).toEqual([["total", 12]]);
  });

  it("drops a reading that only repeats the structured minCredits", () => {
    expect(rule("dup").constraints).toBeUndefined();
  });

  it("keeps a prose cap even when the raw rule has maxCredits, since the normalized rule has no maximum", () => {
    expect(rule("cap").constraints?.map((c) => [c.kind, c.credits, c.source])).toEqual([["max", 12, "text"]]);
    expect(rule("cap")).not.toHaveProperty("maxCredits");
  });

  it("reads CourseDog's completed* conditions as course lists", () => {
    expect(rule("all") as CoursesRule).toMatchObject({ kind: "courses", minCourses: 2, minCredits: 0 });
    expect(rule("any") as CoursesRule).toMatchObject({ kind: "courses", minCourses: 0, minCredits: 2 });
    expect(rule("atleast") as CoursesRule).toMatchObject({ kind: "courses", minCourses: 0, minCredits: 0 });
  });

  it("lets an override replace or hide what was read", () => {
    const overridden = normalizeProgram(raw, resolve, { P: { te: [{ kind: "total", credits: 22, sentence: "Hand-checked" }], dup: [] } });
    const r = overridden.requirements[0].rules;
    expect(r[0].constraints).toEqual([{ kind: "total", credits: 22, sentence: "Hand-checked", source: "override" }]);
    expect(r[1].constraints).toBeUndefined();
  });

  it("reports planned credits without changing progress (show first)", () => {
    const planned = [
      { courseId: 1, credits: 4 },
      { courseId: 3, credits: 4 },
    ];
    const result = evaluateProgram(program, planned).requirements[0];
    const te = result.rules[0];
    expect(te.constraints?.map((p) => [p.planned, p.met])).toEqual([
      [8, false],
      [4, false],
    ]);
    // The 23-credit total isn't met, but the rule's own (structured) status is untouched by it.
    const withoutConstraints = evaluateProgram(normalizeProgram(raw, resolve, { P: { te: [] } }), planned).requirements[0];
    expect(te.satisfied).toBe(withoutConstraints.rules[0].satisfied);
    expect(result.filled).toBe(withoutConstraints.filled);
    expect((te.rule as GroupRule).kind).toBe("allOf");
  });
});
