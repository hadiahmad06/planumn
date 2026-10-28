import { describe, expect, it } from "vitest";
import { evaluateProgram } from "@/domain/requirements";
import { normalizeProgram, type RawProgram } from "./normalize";

// Phase C/C3. Shapes from CourseDog (Applied Economics B.S., Ag & Food Business Mgmt B.S., Anthropology B.A.), trimmed.
const raw = {
  programGroupId: "P",
  requisites: {
    a: [
      {
        id: "g1",
        name: "Electives",
        rules: [
          {
            id: "apec",
            name: "Individualized",
            condition: "freeformText",
            description: "<p>Earn at least 12 credits from the following:</p>",
            notes: "<ul><li><p>APEC 3xxx</p></li><li><p>APEC 4xxx</p></li><li><p>APEC 5xxx</p></li></ul>",
          },
          {
            id: "afbm",
            name: "Individualized",
            condition: "minimumCredits",
            credits: 6,
            value: { condition: "none", values: [] },
            notes: "<ul><li><p>FINA 3XXX</p></li><li><p>MKTG 4XXX</p></li></ul><p>Excluding: FINA 3001, MKTG 3001</p>",
          },
          {
            id: "anth",
            name: "ANTH 4xxx-5xxx",
            condition: "completeVariableCoursesAndVariableCredits",
            minCredits: 3,
            value: { condition: "courses", values: [{ value: ["1"], logic: "or" }] },
          },
        ],
      },
    ],
  },
} as unknown as RawProgram;

const program = normalizeProgram(raw, (groupId) => ({ groupId, courseId: 1, code: "ANTH 4001", title: null, credits: null }));
const rule = (id: string) => program.requirements[0].rules.find((r) => r.id === id)!;

describe("course patterns in the normalizer (C3)", () => {
  it("reads a pattern for rules that list no courses", () => {
    expect(rule("apec").pattern?.subjects).toEqual([{ subject: "APEC", levels: [3, 4, 5] }]);
    expect(rule("afbm").pattern).toMatchObject({ subjects: [{ subject: "FINA", levels: [3] }, { subject: "MKTG", levels: [4] }], excluded: ["FINA 3001", "MKTG 3001"] });
  });

  it("leaves rules that already list their courses alone", () => {
    expect(rule("anth").pattern).toBeUndefined();
  });

  it("lists matching planned courses without counting them", () => {
    const planned = [
      { courseId: 10, credits: 3, code: "FINA 3101" },
      { courseId: 11, credits: 3, code: "FINA 3001" },
      { courseId: 12, credits: 4, code: "APEC 3611W" },
    ];
    const result = evaluateProgram(program, planned).requirements[0].rules;
    const afbm = result.find((r) => r.rule.id === "afbm")!;
    expect(afbm.patternMatches?.map((p) => p.code)).toEqual(["FINA 3101"]);
    expect(afbm).toMatchObject({ satisfied: false, filled: 0, credits: 0 });
    const apec = result.find((r) => r.rule.id === "apec")!;
    expect(apec.patternMatches?.map((p) => p.code)).toEqual(["APEC 3611W"]);
    expect(apec).toMatchObject({ satisfied: false, units: 0, filled: 0 });
  });
});
