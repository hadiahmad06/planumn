import { describe, expect, it } from "vitest";
import { doubleDipCandidates, findDoubleDips } from "./doubleDip";
import { evaluateProgram, type CoursesRule, type Program } from "./requirements";

const opt = (courseId: number) => ({ groupId: String(courseId), courseId, code: null, title: null, credits: null });
const courses = (id: string, ids: number[], minCourses: number, minCredits = 0): CoursesRule => ({
  kind: "courses",
  id,
  name: id,
  notes: null,
  choices: ids.map((i) => ({ options: [opt(i)] })),
  minCourses,
  minCredits,
});
const program = (id: string, reqs: [string, CoursesRule][]): Program => ({
  id,
  name: `${id} B.S.`,
  type: "Major",
  requirements: reqs.map(([rid, rule]) => ({ id: rid, name: rid, notes: null, rules: [rule] })),
});

const major = program("M", [
  ["core", courses("core", [1, 2], 2)],
  ["writing", courses("wi", [2, 3], 1)],
  ["optional", courses("opt", [4, 5], 0)],
]);
const minor = program("N", [["minor", courses("mn", [3, 5, 6], 1)]]);

describe("double-dip finder (B12)", () => {
  it("finds unplanned courses that count toward two unsatisfied things", () => {
    const results = [evaluateProgram(major, []), evaluateProgram(minor, [])];
    const planned = new Set<number>();
    expect(doubleDipCandidates(results, planned).sort()).toEqual([1, 2, 3, 5, 6]);
    const { dips } = findDoubleDips({ results, planned, libEd: { 1: [], 2: [], 3: [], 5: [], 6: ["GP"] }, coveredLibEd: new Set() });
    // 2: core + writing. 3: writing + minor. 6: minor + GP (mixed beats same-count ties). 5 is in an optional rule.
    expect(dips.map((d) => [d.courseId, d.targets.map((t) => (t.kind === "libed" ? t.code : t.requirementId))])).toEqual([
      [6, ["minor", "GP"]],
      [2, ["core", "writing"]],
      [3, ["writing", "minor"]],
    ]);
  });

  it("drops satisfied requirements, covered Lib Ed and planned courses", () => {
    const results = [evaluateProgram(major, [{ courseId: 3, credits: 4 }]), evaluateProgram(minor, [{ courseId: 3, credits: 4 }])];
    const { dips } = findDoubleDips({ results, planned: new Set([3]), libEd: { 1: ["GP", "WI"], 2: ["GP"], 6: ["GP"] }, coveredLibEd: new Set(["GP"]) });
    // Writing and the minor are done by 3; GP is covered. 1: core + WI. 2: core only.
    expect(dips.map((d) => d.courseId)).toEqual([1]);
  });

  it("counts single-requirement courses whose Lib Ed is still loading", () => {
    const results = [evaluateProgram(minor, [])];
    expect(findDoubleDips({ results, planned: new Set(), libEd: { 3: [] }, coveredLibEd: new Set() }).pending).toBe(2);
  });
});
