import { describe, expect, it } from "vitest";
import { pickCourses, placeCourses, type AutofillCourse } from "./autofill";
import { createEmptyPlan } from "./plan";
import { addCourse } from "./planOps";
import { evaluateProgram, type CoursesRule, type Program, type Rule } from "./requirements";

const opt = (courseId: number) => ({ groupId: String(courseId), courseId, code: null, title: null, credits: null, rows: [] });
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

  it("L12: a 1- or 2-term course prefers the seasons seen, falls back to any term, and says so", () => {
    const cat: Record<number, AutofillCourse> = {
      11: { id: 11, code: "CSCI 1115", dept: "CSCI", credits: 4, termsOffered: ["1263"], prereqText: null }, // Spring only, 1 term
      12: { id: 12, code: "CSCI 1116", dept: "CSCI", credits: 4, termsOffered: ["1263", "1273"], prereqText: null }, // Spring, 2 terms
      13: { id: 13, code: "CSCI 1117", dept: "CSCI", credits: 4, termsOffered: ["1253", "1263", "1273"], prereqText: null }, // Spring, 3 terms
    };
    const plan = createEmptyPlan(NOW);
    const place = (id: number, maxCredits = 15) =>
      placeCourses({ plan, picks: [{ courseId: id, reasons: [] }], course: (x) => cat[x], now: NOW, maxCredits });
    // Fall 2026 is the first open term, but Spring 2027 is the season seen.
    expect(place(11).placements[0]).toMatchObject({ term: "1273", offeringNote: "limited history (1 term): seen in Spring, a guess" });
    expect(place(12).placements[0]).toMatchObject({ term: "1273", offeringNote: "limited history (2 terms): seen in Spring, a guess" });
    expect(place(13).placements[0]).toEqual({ courseId: 13, reasons: [], term: "1273" });
    // No room in any spring: a limited course still goes in (the earliest fall), a known one is not placed.
    const springsFull = { ...plan, semesters: plan.semesters.map((s) => (s.index.endsWith("3") ? { ...s, placeholders: [{ key: `p${s.index}`, label: "Full", credits: 15 }] } : s)) };
    const full = (id: number) => placeCourses({ plan: springsFull, picks: [{ courseId: id, reasons: [] }], course: (x) => cat[x], now: NOW });
    expect(full(11).placements[0]).toMatchObject({ term: "1269", offeringNote: "limited history (1 term): not seen in Fall, a guess" });
    expect(full(13).placements).toEqual([]);
  });

  describe("dependents that need a pick (L12 review B1)", () => {
    const SEPT = new Date(2026, 8, 15); // Fall 2026 in progress: the first open term is Spring 2027
    const cat: Record<number, AutofillCourse> = {
      21: { id: 21, code: "CSCI 1001", dept: "CSCI", credits: 4, termsOffered: ["1259"], prereqText: null }, // 1 term, Fall
      22: { id: 22, code: "CSCI 2002", dept: "CSCI", credits: 4, termsOffered: ["1253", "1263", "1273"], prereqText: "CSCI 1001" },
      23: { id: 23, code: "CSCI 2003", dept: "CSCI", credits: 4, termsOffered: ["1253", "1263", "1273"], prereqText: "CSCI 1001 or CSCI 1002" },
      24: { id: 24, code: "CSCI 1002", dept: "CSCI", credits: 4, termsOffered: FALL_SPRING, prereqText: null },
      25: { id: 25, code: "CSCI 1005", dept: "CSCI", credits: 4, termsOffered: ["1179", "1189", "1199"], prereqText: null }, // known, Fall only
      26: { id: 26, code: "CSCI 2006", dept: "CSCI", credits: 4, termsOffered: FALL_SPRING, prereqText: "CSCI 1005" },
    };
    const lookup = (id: number) => cat[id];
    const pick = (id: number) => ({ courseId: id, reasons: [] });

    it("reviewer's repro: a 1-term Fall course goes before the planned course that needs it, not into its term", () => {
      const plan = addCourse(createEmptyPlan(NOW), "1279", 22); // CSCI 2002 in Fall 2027
      const r = placeCourses({ plan, picks: [pick(21)], course: lookup, now: SEPT });
      expect(r.placements).toEqual([
        { courseId: 21, reasons: [], term: "1273", offeringNote: "limited history (1 term): not seen in Spring, a guess" },
      ]);
    });

    it("still prefers a seen season when it is before the dependent", () => {
      const plan = addCourse(createEmptyPlan(NOW), "1283", 22); // CSCI 2002 in Spring 2028
      const r = placeCourses({ plan, picks: [pick(21)], course: lookup, now: SEPT });
      expect(r.placements[0]).toMatchObject({ term: "1279", offeringNote: "limited history (1 term): seen in Fall, a guess" });
    });

    it("ignores a dependent that has another planned way through an 'or'", () => {
      let plan = addCourse(createEmptyPlan(NOW), "1273", 24); // CSCI 1002 in Spring 2027
      plan = addCourse(plan, "1279", 23); // CSCI 2003: CSCI 1001 or CSCI 1002
      const r = placeCourses({ plan, picks: [pick(21)], course: lookup, now: SEPT });
      expect(r.placements[0].term).toBe("1279"); // the seen season; CSCI 2003 doesn't need it
    });

    it("leaves a pick unplaced rather than after its dependent (also for a known history, which v2/main placed late)", () => {
      // CSCI 1005 is fall-only (known). Fall 2027 is full, CSCI 2006 needs it in Spring 2028; v2/main gave Fall 2028.
      let plan = addCourse(createEmptyPlan(NOW), "1283", 26);
      plan = { ...plan, semesters: plan.semesters.map((s) => (s.index === "1279" ? { ...s, placeholders: [{ key: "full", label: "Full", credits: 15 }] } : s)) };
      const r = placeCourses({ plan, picks: [pick(25)], course: lookup, now: SEPT });
      expect(r.placements).toEqual([]);
      expect(r.unplaced).toEqual([{ courseId: 25, reasons: [], why: "Can't fit before CSCI 2006 (Spring 2028), which needs it" }]);
      // With room, it goes in the only fall before the dependent.
      const roomy = placeCourses({ plan: addCourse(createEmptyPlan(NOW), "1283", 26), picks: [pick(25)], course: lookup, now: SEPT });
      expect(roomy.placements[0].term).toBe("1279");
    });

    it("keeps picks that depend on each other in order", () => {
      const r = placeCourses({ plan: createEmptyPlan(NOW), picks: [pick(22), pick(21)], course: lookup, now: SEPT });
      const at = Object.fromEntries(r.placements.map((p) => [p.courseId, p.term]));
      expect(at[21]).toBe("1279"); // seen in Fall
      expect(at[22]).toBe("1283"); // after it, in Spring
    });
  });

  it("reports courses with no offered term left", () => {
    const plan = createEmptyPlan(NOW);
    // In Fall 2029 that term is in progress, and no later fall is left in the plan.
    const r = placeCourses({ plan, picks: [{ courseId: 4, reasons: ["x"] }], course, now: new Date(2029, 10, 1) });
    expect(r.unplaced).toEqual([{ courseId: 4, reasons: ["x"], why: "Not historically offered in the remaining terms" }]);
  });
});
