import { describe, expect, it } from "vitest";
import { pickCourses } from "./autofill";
import { doubleDipCandidates, findDoubleDips } from "./doubleDip";
import { rankMinors } from "./minors";
import {
  evaluateProgram,
  listedCourseIds,
  optionAsRow,
  optionFromRows,
  programCourseCodes,
  programCourseIds,
  programListsCourse,
  suggestedCourseId,
  type CourseOption,
  type CoursesRule,
  type Program,
} from "./requirements";

/**
 * L11 (Hadi's Claude): a renumbered course keeps its CourseDog id, so one requirement option has several
 * catalog rows. Ids, codes and last terms are data/catalog.db's (src/server/catalog/sharedGroups.test.ts
 * checks them against the db): `0049451` = ENGW 1102 (703, last 1233) and ENGW 1102W (8090, last 1265);
 * `0031151` = CHIC 1112 (3996, last 1253) and CHLS 1112 (11019, last 1263).
 */
const cr = { min: 3, max: 3 };
const ENGW = optionFromRows("0049451", [
  { courseId: 703, code: "ENGW 1102", title: "Introduction to Fiction Writing", credits: cr, lastTerm: "1233" },
  { courseId: 8090, code: "ENGW 1102W", title: "Introduction to Fiction Writing", credits: cr, lastTerm: "1265" },
]);
const CHLS = optionFromRows("0031151", [
  { courseId: 3996, code: "CHIC 1112", title: "Chicano/Latino Studies", credits: cr, lastTerm: "1253" },
  { courseId: 11019, code: "CHLS 1112", title: "Chicano/Latino Studies", credits: cr, lastTerm: "1263" },
]);
const single = (courseId: number, code: string): CourseOption =>
  optionFromRows(String(courseId), [{ courseId, code, title: code, credits: cr, lastTerm: "1259" }]);

const rule = (id: string, options: CourseOption[][], minCourses = 1, minCredits = 0): CoursesRule => ({
  kind: "courses",
  id,
  name: id,
  notes: null,
  choices: options.map((o) => ({ options: o })),
  minCourses,
  minCredits,
});
const program = (id: string, reqs: [string, CoursesRule][]): Program => ({
  id,
  name: `${id} B.A.`,
  type: "Major",
  requirements: reqs.map(([rid, r]) => ({ id: rid, name: rid, notes: null, rules: [r] })),
});
const planned = (...ids: number[]) => ids.map((courseId) => ({ courseId, credits: 3 }));

describe("options backed by a shared CourseDog id (L11)", () => {
  it("suggests the row with the newest offering and keeps every row", () => {
    expect(ENGW).toMatchObject({ courseId: 8090, code: "ENGW 1102W" });
    expect(ENGW.rows.map((r) => r.courseId)).toEqual([8090, 703]);
    expect(CHLS).toMatchObject({ courseId: 11019, code: "CHLS 1112" });
    // Never offered sorts last; a tie goes to the higher (newer) catalog id.
    const tie = optionFromRows("g", [
      { courseId: 1, code: "A 1", title: "", credits: cr, lastTerm: null },
      { courseId: 2, code: "A 2", title: "", credits: cr, lastTerm: "1259" },
      { courseId: 3, code: "A 3", title: "", credits: cr, lastTerm: "1259" },
    ]);
    expect(tie.rows.map((r) => r.courseId)).toEqual([3, 2, 1]);
    expect(optionFromRows("none", [])).toMatchObject({ courseId: null, rows: [] });
  });

  it("ENGW 1102W and CHLS 1112 satisfy their options, and so do the older codes", () => {
    const p = program("P", [
      ["fiction", rule("fiction", [[ENGW]])],
      ["chls", rule("chls", [[CHLS]])],
    ]);
    for (const ids of [[8090, 11019], [703, 3996]]) {
      const result = evaluateProgram(p, planned(...ids));
      expect(result.requirements.map((r) => r.satisfied)).toEqual([true, true]);
      expect(result.requirements.flatMap((r) => r.courseIds)).toEqual(ids);
      expect(result.requirements.map((r) => r.rules[0].choiceMatches)).toEqual(ids.map((id) => [id]));
    }
  });

  it("planning both codes of one course fills only one choice", () => {
    const r = evaluateProgram(program("P", [["two", rule("two", [[ENGW], [single(5, "ENGL 1001")]], 2)]]), planned(703, 8090));
    expect(r.requirements[0].satisfied).toBe(false);
    expect(r.requirements[0].rules[0].coursesCount).toBe(1);
  });

  it("counts each row under its own subject for a dept credit reading", () => {
    const withDept: CoursesRule = {
      ...rule("chls", [[CHLS]]),
      constraints: [{ kind: "dept", credits: 3, scope: "CHLS", source: "text", sentence: "3 credits in CHLS" }],
    };
    const progress = (id: number) => evaluateProgram(program("P", [["chls", withDept]]), planned(id), { catalogText: "show" }).requirements[0].rules[0].constraints?.[0].planned;
    expect(progress(11019)).toBe(3);
    expect(progress(3996)).toBe(0);
  });

  it("lists every row for search filters and the elective badge", () => {
    const p = program("P", [["chls", rule("chls", [[CHLS]])]]);
    expect(listedCourseIds(p.requirements[0].rules[0])).toEqual([11019, 3996]);
    const ids = programCourseIds(p);
    const codes = programCourseCodes(p);
    expect(programListsCourse(ids, codes, 3996, "CHIC 1112")).toBe(true);
    expect(programListsCourse(ids, codes, 11019, "CHLS 1112")).toBe(true);
    // Before L11 the badge knew CHLS 1112 only by id; by code it still matches.
    expect(programListsCourse(new Set(), codes, 999, "CHIC 1112")).toBe(true);
  });

  it("the rail shows the planned row; suggestions skip an option with any row planned", () => {
    expect(optionAsRow(ENGW, 703)).toMatchObject({ courseId: 703, code: "ENGW 1102" });
    expect(optionAsRow(ENGW, 8090)).toBe(ENGW);
    expect(suggestedCourseId(ENGW, new Set())).toBe(8090);
    expect(suggestedCourseId(ENGW, new Set([703]))).toBeNull();
  });

  it("autofill picks the newest row", () => {
    const p = program("P", [["fiction", rule("fiction", [[ENGW]])]]);
    expect(pickCourses([evaluateProgram(p, [])], new Set()).picks).toEqual([{ courseId: 8090, reasons: ["fiction"] }]);
  });

  it("the double-dip finder suggests the newest row and nothing for a course planned under its old code", () => {
    const major = program("M", [
      ["fiction", rule("fiction", [[ENGW]])],
      ["writing", rule("writing", [[ENGW], [single(5, "ENGL 1001")]], 2)],
    ]);
    const fresh = [evaluateProgram(major, [])];
    expect(doubleDipCandidates(fresh, new Set()).sort()).toEqual([5, 8090]);
    const { dips } = findDoubleDips({ results: fresh, planned: new Set(), libEd: { 5: [], 8090: [] }, coveredLibEd: new Set() });
    expect(dips.map((d) => d.courseId)).toEqual([8090]);
    // ENGW 1102 planned: "writing" is still unmet (needs ENGL 1001), but ENGW isn't suggested again.
    const old = [evaluateProgram(major, planned(703))];
    expect(doubleDipCandidates(old, new Set([703]))).toEqual([5]);
  });

  it("the minor finder matches a planned row of a shared group", () => {
    const minor = { ...program("N", [["chls", rule("chls", [[CHLS]])]]), type: "Minor" };
    expect(rankMinors([minor], planned(11019))).toEqual([{ id: "N", name: "N B.A.", matched: [11019], filled: 1, units: 1 }]);
    expect(rankMinors([minor], planned(3996))[0].matched).toEqual([3996]);
  });
});
