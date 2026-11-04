import { describe, expect, it } from "vitest";
import { evaluateProgram, type CoursesRule } from "@/domain/requirements";
import { normalizeProgram, type RawProgram } from "./normalize";

// Phase C/C3. EE B.E.E.'s technical elective requirement as CourseDog shapes it (2026-10-27 survey, C0
// report), trimmed: four counted rules, then the pattern rule that lists no courses, then the integrated
// B.S./M.S. cap sentence. Catalog ids are data/catalog.db's (EE 4111 = 4693, EE 4981H = 1266, CSCI 4203 = 4763).
const ids = (...v: string[]) => ({ condition: "courses", values: v.map((id) => ({ value: [id], logic: "or" })) });
const CATALOG: Record<string, { courseId: number; code: string; credits: number }> = {
  g4301: { courseId: 1, code: "EE 4301", credits: 4 },
  g4231: { courseId: 2, code: "EE 4231", credits: 4 },
  g4161: { courseId: 3, code: "EE 4161W", credits: 4 },
  g4505: { courseId: 4, code: "EE 4505", credits: 4 },
};
const raw = {
  programGroupId: "026421707",
  requisites: {
    a: [
      {
        id: "tech",
        name: "Electrical Engineering Technical Elective Program",
        rules: [
          { id: "r1", name: "Circuits", condition: "minimumCredits", minCredits: 4, value: ids("g4301") },
          { id: "r2", name: "Signals", condition: "minimumCredits", minCredits: 4, value: ids("g4231") },
          { id: "r3", name: "Design", condition: "minimumCredits", minCredits: 4, value: ids("g4161") },
          { id: "r4", name: "Power", condition: "minimumCredits", minCredits: 4, value: ids("g4505") },
          {
            id: "pattern",
            name: "Complete additional 4xxx/5xxx EE courses to meet the minimum 22 credits of required Core Department Electives.",
            condition: "freeformText",
            value: "",
            notes: "<p>Excludes EE 4981H.</p><p>Includes CSCI 4203.</p>",
          },
          {
            id: "cap",
            name: "Students may not exceed a combined 16 credits total of coursework of EE 5000 level graduate coursework and additional coursework.",
            condition: "freeformText",
            value: "",
          },
          {
            id: "listed",
            name: "EE 4xxx electives",
            condition: "minimumCredits",
            minCredits: 0,
            description: "Any 4xxx/5xxx EE course from this list.",
            value: ids("g4505"),
          },
        ],
      },
      // Architecture B.D.A.'s shape: a 9-credit course rule with an empty course list.
      {
        id: "arch",
        name: "Upper-Division Electives Outside the ARCH Designator",
        rules: [{ id: "empty", name: "Upper-Division Electives: non-ARCH", condition: "minimumCredits", minCredits: 9, value: ids() }],
      },
    ],
  },
} as unknown as RawProgram;

const resolve = (groupId: string) => {
  const c = CATALOG[groupId];
  return { groupId, courseId: c?.courseId ?? null, code: c?.code ?? null, title: null, credits: c ? { min: c.credits, max: c.credits } : null };
};
const program = normalizeProgram(raw, resolve, {}, new Set(["EE", "CSCI", "ARCH"]));
const rule = (id: string) => program.requirements.flatMap((q) => q.rules).find((r) => r.id === id)!;

describe("pattern rules in the normalizer (C3)", () => {
  it("reads a pattern from the name and notes of a rule that lists no courses", () => {
    expect(rule("pattern").pattern).toMatchObject({
      terms: [{ subjects: ["EE"], levels: [4, 5] }],
      exceptSubjects: [],
      exclude: ["EE 4981H"],
      include: ["CSCI 4203"],
    });
    expect(rule("empty").pattern).toMatchObject({ terms: [{ subjects: [], levels: [3], orHigher: true }], exceptSubjects: ["ARCH"] });
  });

  it("keeps non-ARCH when the text also gives any-subject levels, and adds no 'upper division' level then (review fix)", () => {
    const arch = {
      programGroupId: "214623122",
      requisites: {
        a: [{ id: "g", name: "Upper-Division Electives Outside the ARCH Designator", rules: [{ id: "x", name: "Upper-Division Electives: non-ARCH", condition: "freeformText", value: "<p>xxxx 3xxx xxxx 4xxx</p>" }] }],
      },
    } as unknown as RawProgram;
    const p = normalizeProgram(arch, resolve, {}, new Set(["ARCH", "HIST"]));
    const planned = [
      { courseId: 1, credits: 3, code: "ARCH 3150" },
      { courseId: 2, credits: 3, code: "HIST 3001" },
      { courseId: 3, credits: 3, code: "HIST 5001" },
    ];
    expect(evaluateProgram(p, planned).requirements[0].rules[0].patternMatches?.map((m) => m.code)).toEqual(["HIST 3001"]);
    // Architecture isn't in CATALOG_TEXT_COUNTED, so its matches are shown, not counted (Hadi, 2026-11-04).
    expect(evaluateProgram(p, planned).requirements[0].courseIds).toEqual([]);
    expect(evaluateProgram(p, planned, { catalogText: "count" }).requirements[0].courseIds).toEqual([2]);
  });

  it("skips the cap sentence and leaves rules that list courses alone", () => {
    expect(rule("cap").pattern).toBeUndefined();
    expect(rule("listed").pattern).toBeUndefined();
    expect((rule("listed") as CoursesRule).choices).toHaveLength(1);
  });

  it("lists planned EE 4111 under the pattern but keeps the requirement at 0/4 when shown only", () => {
    const planned = [
      { courseId: 4693, credits: 4, code: "EE 4111" },
      { courseId: 1266, credits: 2, code: "EE 4981H" },
      { courseId: 4763, credits: 4, code: "CSCI 4203" },
    ];
    const [result, arch] = evaluateProgram(program, planned, { catalogText: "show" }).requirements;
    expect([result.filled, result.units, result.satisfied]).toEqual([0, 4, false]);
    const patternRule = result.rules.find((r) => r.rule.id === "pattern")!;
    expect(patternRule.patternMatches).toEqual([
      { courseId: 4693, code: "EE 4111", credits: 4 },
      { courseId: 4763, code: "CSCI 4203", credits: 4 },
    ]);
    expect([patternRule.units, patternRule.filled, patternRule.satisfied]).toEqual([0, 0, false]);
    // The requirement's planned courses are only the ones a listed rule matched.
    expect(result.courseIds).toEqual([]);
    // The empty 9-credit rule still counts as a unit and stays unmet, whatever matches its pattern.
    const empty = evaluateProgram(program, [{ courseId: 7, credits: 9, code: "HIST 3001" }], { catalogText: "show" }).requirements[1].rules[0];
    expect(empty.patternMatches).toEqual([{ courseId: 7, code: "HIST 3001", credits: 9 }]);
    expect([empty.units, empty.filled, empty.credits]).toEqual([1, 0, 0]);
    expect([arch.filled, arch.units]).toEqual([0, 1]);
  });

  it("counts matching courses in the requirement's courses once EE is checked against APAS (2026-11-03)", () => {
    const planned = [{ courseId: 4693, credits: 4, code: "EE 4111" }];
    const result = evaluateProgram(program, planned).requirements[0];
    expect(result.rules.find((r) => r.rule.id === "pattern")?.catalogTextCounted).toBe(true);
    expect(result.courseIds).toEqual([4693]);
    // A pattern rule gets no unit of its own: the credit amount lives on its parent.
    expect(result.units).toBe(evaluateProgram(program, planned, { catalogText: "show" }).requirements[0].units);
  });

  it("gives the same progress with or without pattern readings when shown only", () => {
    const planned = [{ courseId: 4693, credits: 4, code: "EE 4111" }];
    const strip = (p: typeof program) => ({
      ...p,
      requirements: p.requirements.map((r) => ({ ...r, rules: r.rules.map((x) => ({ ...x, pattern: undefined })) })),
    });
    const a = evaluateProgram(program, planned, { catalogText: "show" });
    const b = evaluateProgram(strip(program), planned, { catalogText: "show" });
    expect([a.filled, a.units]).toEqual([b.filled, b.units]);
  });
});
