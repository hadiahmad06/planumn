import { describe, expect, it } from "vitest";
import { pickCourses, placeCourses, type AutofillCourse } from "./autofill";
import { createEmptyPlan } from "./plan";
import { addCourse } from "./planOps";
import { evaluateProgram, type CoursesRule, type Program, type Rule } from "./requirements";

const opt = (courseId: number) => ({ groupId: String(courseId), courseId, code: null, title: null, credits: null });
const courses = (id: string, ids: number[][], minCourses: number, minCredits = 0): CoursesRule => ({
  kind: "courses",
  id,
  name: id,
  notes: null,
  choices: ids.map((options) => ({ options: options.map(opt) })),
  minCourses,
  minCredits,
});
const program = (reqs: [string, Rule][]): Program => ({
  id: "P",
  name: "Test B.S.",
  type: "Major",
  requirements: reqs.map(([rid, rule]) => ({ id: rid, name: rid, notes: null, rules: [rule] })),
});

const FALL_SPRING = ["1179", "1183", "1189", "1193"];
const catalog: Record<number, AutofillCourse> = {
  1: { id: 1, code: "CSCI 1133", dept: "CSCI", credits: 4, termsOffered: FALL_SPRING, prereqText: null },
  2: { id: 2, code: "CSCI 1933", dept: "CSCI", credits: 4, termsOffered: FALL_SPRING, prereqText: "CSCI 1133" },
  3: { id: 3, code: "CSCI 2041", dept: "CSCI", credits: 4, termsOffered: FALL_SPRING, prereqText: "CSCI 1933" },
  4: { id: 4, code: "CSCI 5481", dept: "CSCI", credits: 3, termsOffered: ["1179", "1189", "1199"], prereqText: null },
  5: { id: 5, code: "WRIT 3029", dept: "WRIT", credits: 3, termsOffered: ["1179", "1183", "1185", "1189"], prereqText: null },
  6: { id: 6, code: "CSCI 4041", dept: "CSCI", credits: 4, termsOffered: FALL_SPRING, prereqText: "MATH 1271" },
};
const course = (id: number) => catalog[id];
const NOW = new Date(2026, 3, 1); // before Fall 2026; plan runs Fall 2026 – Summer 2030

describe("autofill (B24)", () => {
  it("picks what each unsatisfied requirement still needs, preferring double-dips", () => {
    const p = program([
      ["core", courses("core", [[1], [2], [3]], 3)],
      ["writing", courses("wi", [[5], [3]], 1)],
      ["elective", courses("el", [[4], [6]], 1)],
    ]);
    const { picks, skipped } = pickCourses([evaluateProgram(p, [])], new Set());
    expect(skipped).toEqual([]);
    // CSCI 2041 (3) is already picked for the core, so the writing requirement reuses it.
    expect(picks).toEqual([
      { courseId: 1, reasons: ["core"] },
      { courseId: 2, reasons: ["core"] },
      { courseId: 3, reasons: ["core", "writing"] },
      { courseId: 4, reasons: ["elective"] },
    ]);
  });

  it("skips satisfied requirements, planned courses and text-only rules (0 units)", () => {
    const p = program([
      ["core", courses("core", [[1], [2]], 2)],
      ["notes", { kind: "text", id: "t", name: "t", notes: null, text: "See advisor" }],
    ]);
    const planned = new Set([1]);
    const { picks, skipped } = pickCourses([evaluateProgram(p, [{ courseId: 1, credits: 4 }])], planned);
    expect(picks.map((x) => x.courseId)).toEqual([2]);
    expect(skipped).toEqual([]);
  });

  it("places in prerequisite order, in offered seasons, under the credit cap", () => {
    const plan = createEmptyPlan(NOW);
    const picks = [3, 2, 1, 4].map((courseId) => ({ courseId, reasons: ["core"] }));
    const { placements, unplaced } = placeCourses({ plan, picks, course, now: NOW, maxCredits: 8, useSummer: true });
    const at = Object.fromEntries(placements.map((p) => [p.courseId, p.term]));
    expect(unplaced).toEqual([]);
    expect(at[1]).toBe("1269"); // Fall 2026
    expect(at[2]).toBe("1273"); // after 1133: Spring 2027
    expect(at[3]).toBe("1279"); // after 1933: Fall 2027
    expect(at[4]).toBe("1279"); // fall-only 5xxx: not in the plan's first year, so Fall 2027 (beside 2041: 4 + 3 ≤ 8)
  });

  it("respects existing load, leave semesters and hidden seasons, and notes outside prerequisites", () => {
    let plan = createEmptyPlan(NOW);
    plan = addCourse(plan, "1269", 1);
    plan = { ...plan, semesters: plan.semesters.map((s) => (s.index === "1273" ? { ...s, kind: "leave" as const } : s)) };
    const { placements } = placeCourses({ plan, picks: [{ courseId: 2, reasons: [] }, { courseId: 6, reasons: [] }], course, now: NOW, hiddenSeasons: ["summer"], maxCredits: 4 });
    // Fall 2026 is full (CSCI 1133); Spring 2027 is a leave; so Fall 2027 and Spring 2028.
    expect(placements.map((p) => [p.courseId, p.term])).toEqual([
      [2, "1279"],
      [6, "1283"],
    ]);
    expect(placements[1].note).toBe("Needs MATH 1271");
  });

  it("waits for a picked prerequisite instead of counting an outside alternative", () => {
    const cat: Record<number, AutofillCourse> = {
      7: { id: 7, code: "MATH 1371", dept: "MATH", credits: 4, termsOffered: ["1179", "1189", "1199"], prereqText: null },
      8: { id: 8, code: "CSCI 2033", dept: "CSCI", credits: 4, termsOffered: FALL_SPRING, prereqText: "MATH [1271 OR 1371]" },
    };
    const plan = createEmptyPlan(NOW);
    const r = placeCourses({ plan, picks: [8, 7].map((courseId) => ({ courseId, reasons: [] })), course: (id) => cat[id], now: NOW });
    // MATH 1371 is fall-only (Fall 2026); CSCI 2033 waits until after it (Spring 2027), not alongside.
    expect(r.placements.map((p) => [p.courseId, p.term])).toEqual([
      [7, "1269"],
      [8, "1273"],
    ]);
  });

  it("skips summers unless asked", () => {
    // In Spring 2027 the next term is Summer 2027; WRIT 1029 has run in summers.
    const plan = createEmptyPlan(NOW);
    const cat = (id: number) => (id === 5 ? { ...catalog[5], code: "WRIT 1029" } : catalog[id]);
    const term = (useSummer: boolean) =>
      placeCourses({ plan, picks: [{ courseId: 5, reasons: [] }], course: cat, now: new Date(2027, 1, 1), useSummer }).placements[0].term;
    expect(term(false)).toBe("1279");
    expect(term(true)).toBe("1275");
  });

  it("keeps upper-division courses out of the plan's first year", () => {
    const plan = createEmptyPlan(NOW);
    const held = placeCourses({ plan, picks: [{ courseId: 5, reasons: [] }], course, now: NOW }).placements[0];
    expect(held).toMatchObject({ term: "1279", heldUpperDivision: true }); // WRIT 3029
    // The rule is optional.
    expect(placeCourses({ plan, picks: [{ courseId: 5, reasons: [] }], course, now: NOW, holdUpperDivision: false }).placements[0].term).toBe("1269");
  });

  it("reports courses with no offered term left", () => {
    const plan = createEmptyPlan(NOW);
    // In Fall 2029 that term is in progress, and no later fall is left in the plan.
    const r = placeCourses({ plan, picks: [{ courseId: 4, reasons: ["x"] }], course, now: new Date(2029, 10, 1) });
    expect(r.unplaced).toEqual([{ courseId: 4, reasons: ["x"], why: "Not historically offered in the remaining terms" }]);
  });
});
