import { describe, expect, it } from "vitest";
import { evaluateProgram, type CoursesRule, type GroupRule } from "@/domain/requirements";
import { catalogTextCheck } from "@/domain/catalogTextCounting";
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
          // #82 review: structured credits the normalized rule doesn't keep, so the prose reading must stay.
          {
            id: "anycr",
            name: "Math Electives",
            condition: "anyOf",
            minCredits: 12,
            description: "Take at least 12 credits from the following.",
            subRules: [{ id: "anycr.list", name: "Math list", condition: "minimumCourses", minCourses: 1, value: ids("3") }],
          },
          { id: "varcr", name: "Free Electives", condition: "completeVariableCoursesAndVariableCredits", credits: 12, description: "Take 12 credits from the following.", value: ids("1", "2") },
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

  it("keeps a reading whose structured credits the normalized rule doesn't count", () => {
    expect(rule("anycr")).not.toHaveProperty("minCredits");
    expect(rule("anycr").constraints?.map((c) => [c.kind, c.credits])).toEqual([["total", 12]]);
    expect(rule("varcr") as CoursesRule).toMatchObject({ minCredits: 0 });
    expect(rule("varcr").constraints?.map((c) => [c.kind, c.credits])).toEqual([["total", 12]]);
    // Shown only (the default for a program not checked against APAS), the anyOf reads satisfied with 4
    // credits, and the box says 4 of 12; counted, the 12-credit reading is one more unit and keeps it unmet.
    const anycr = (options?: { catalogText: "count" | "show" }) =>
      evaluateProgram(program, [{ courseId: 3, credits: 4 }], options).requirements[0].rules.find((r) => r.rule.id === "anycr")!;
    expect(anycr({ catalogText: "show" }).satisfied).toBe(true);
    expect(anycr({ catalogText: "show" }).constraints?.map((p) => [p.planned, p.met])).toEqual([[4, false]]);
    expect(anycr()).toEqual(anycr({ catalogText: "show" }));
    expect(anycr({ catalogText: "count" })).toMatchObject({ satisfied: false, units: 2, filled: 1 });
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

  it("reports planned credits without changing progress when shown only (catalogText: \"show\")", () => {
    const planned = [
      { courseId: 1, credits: 4 },
      { courseId: 3, credits: 4 },
    ];
    const result = evaluateProgram(program, planned, { catalogText: "show" }).requirements[0];
    const te = result.rules[0];
    expect(te.constraints?.map((p) => [p.planned, p.met])).toEqual([
      [8, false],
      [4, false],
    ]);
    // The 23-credit total isn't met, but the rule's own (structured) status is untouched by it.
    const withoutConstraints = evaluateProgram(normalizeProgram(raw, resolve, { P: { te: [] } }), planned, { catalogText: "show" }).requirements[0];
    expect(te.satisfied).toBe(withoutConstraints.rules[0].satisfied);
    expect(result.filled).toBe(withoutConstraints.filled);
    expect((te.rule as GroupRule).kind).toBe("allOf");
  });

  it("shows, never counts, the readings of a program C4 never checked, as shown only (Hadi, 2026-11-04)", () => {
    const planned = [
      { courseId: 1, credits: 4 },
      { courseId: 3, credits: 4 },
    ];
    expect(catalogTextCheck("P")).toBeUndefined();
    expect(evaluateProgram(program, planned)).toEqual(evaluateProgram(program, planned, { catalogText: "show" }));
    const counted = evaluateProgram(program, planned, { catalogText: "count" });
    const shown = evaluateProgram(program, planned);
    expect(shown.catalogTextCounted).toBe(false);
    expect(counted.catalogTextCounted).toBe(true);
    // The 23-credit total and 11 CSCI credits are one more unit on "te", unmet with 8 credits.
    expect(counted.requirements[0].rules[0]).toMatchObject({ units: shown.requirements[0].rules[0].units + 1, satisfied: false });
    expect(counted.units).toBeGreaterThan(shown.units);
    expect(counted.requirements[0].satisfied).toBe(false);
  });
});
