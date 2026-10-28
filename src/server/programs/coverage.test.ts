import { describe, expect, it } from "vitest";
import { analyzeProgram, creditPhrases, type IdStatus } from "./coverage";
import type { RawProgram } from "./normalize";

// Shapes from CourseDog (CS B.S., EE B.E.E., 2026-10-27), trimmed to what C0 reads.
const raw = {
  programGroupId: "P1",
  catalogDisplayName: "Test B.S.",
  requisites: {
    a: [
      {
        name: "Technical Electives",
        rules: [
          {
            name: "Upper-division electives",
            condition: "completeVariableCoursesAndVariableCredits",
            description: "<p>Must total 23 credits; 11 must have a CSCI designator.</p>",
            value: { condition: "courses", values: [{ value: ["0036731", "aT7UWrjzP4lvMr3krIMi"], logic: "or" }] },
          },
          { name: "Pattern", condition: "freeformText", value: "<p>Additional 4xxx/5xxx EE courses</p>" },
        ],
      },
      {
        name: "Breadth and Depth",
        notes: "<p>Take 12-16 credits from the lists below.</p>",
        rules: [
          {
            name: "Areas",
            condition: "anyOf",
            subRules: [
              { name: "Area 1", condition: "minimumCredits", minCredits: 4, value: { condition: "courses", values: [{ value: ["nVzH5vryuHXiotc1enDx"] }] } },
              { name: "Area 2", condition: "completedAnyOf", credits: 0, value: { condition: "courses", values: [] } },
            ],
          },
        ],
      },
    ],
  },
} as unknown as RawProgram;

const status: Record<string, IdStatus> = { "0036731": "catalog", aT7UWrjzP4lvMr3krIMi: "old", nVzH5vryuHXiotc1enDx: "unresolved" };
const c = analyzeProgram(raw, (id) => status[id]);

describe("requirement coverage (C0)", () => {
  it("counts conditions and flags ones the normalizer has no case for", () => {
    expect(c.rules).toBe(5);
    expect(c.conditions).toMatchObject({ completedAnyOf: 1, freeformText: 1, minimumCredits: 1 });
    expect(c.unhandled).toEqual([{ requirement: "Breadth and Depth", rule: "Area 2", detail: "completedAnyOf" }]);
  });

  it("lists freeformText rules with their text", () => {
    expect(c.freeform[0]).toMatchObject({ rule: "Pattern", detail: "Additional 4xxx/5xxx EE courses" });
  });

  it("finds credit counts that only exist in prose (rule descriptions and requirement notes)", () => {
    expect(c.proseOnlyCredits.map((f) => [f.rule, f.detail])).toEqual([
      ["Upper-division electives", "23 credits"],
      ["(requirement notes)", "12-16 credits"],
    ]);
  });

  it("does not flag prose when the rule has structured credits", () => {
    expect(c.proseOnlyCredits.some((f) => f.rule === "Area 1")).toBe(false);
  });

  it("tallies course ids by where they resolve", () => {
    expect(c.ids).toEqual({ catalog: 1, coursedog: 0, old: 1, unresolved: 1 });
    expect(c.unresolvedIds).toEqual(["nVzH5vryuHXiotc1enDx"]);
  });

  it("reports course rules that normalize to no options", () => {
    expect(c.emptyCourseRules.map((f) => f.rule)).toEqual(["Area 2"]);
  });

  it("reads credit phrases", () => {
    expect(creditPhrases("34 total credits, minimum of 22 credits; up to 12 credits; 4 cr")).toEqual(["34 total credits", "22 credits", "12 credits", "4 cr"]);
    expect(creditPhrases("3.5 credits or 2 to 4 credits")).toEqual(["3.5 credits", "2 to 4 credits"]);
    expect(creditPhrases(null)).toEqual([]);
  });
});
