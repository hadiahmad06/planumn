import { describe, expect, it } from "vitest";
import { createEmptyPlan, type Plan } from "./plan";
import {
  addCourse,
  addNextSemester,
  addSemester,
  addYearAtEnd,
  addYearAtStart,
  groupByYear,
  missingTermsInYear,
  moveCourse,
  moveCourseToTerm,
  removeCourse,
  removeSemester,
  removeYear,
  setLock,
  sumCredits,
} from "./planOps";

const base = (): Plan => createEmptyPlan(new Date(2026, 3, 1)); // starts Fall 2026 = "1269"
const ids = (p: Plan, term: string) => p.semesters.find((s) => s.index === term)!.courses.map((c) => c.id);

describe("course edits", () => {
  it("adds at an index and refuses duplicates in one semester", () => {
    let p = addCourse(base(), "1269", 1);
    p = addCourse(p, "1269", 2, 0);
    expect(ids(p, "1269")).toEqual([2, 1]);
    expect(addCourse(p, "1269", 1)).toBe(p);
  });

  it("reorders within a semester", () => {
    let p = ["1269", "1269", "1269"].reduce((acc, t, i) => addCourse(acc, t, i + 1), base());
    p = moveCourse(p, { term: "1269", index: 0 }, { term: "1269", index: 2 });
    expect(ids(p, "1269")).toEqual([2, 3, 1]);
  });

  it("moves between semesters, but not locked courses or into a duplicate", () => {
    let p = addCourse(addCourse(base(), "1269", 1), "1273", 2);
    p = moveCourse(p, { term: "1269", index: 0 }, { term: "1273", index: 0 });
    expect(ids(p, "1269")).toEqual([]);
    expect(ids(p, "1273")).toEqual([1, 2]);

    const locked = setLock(addCourse(base(), "1269", 5), "1269", 5, "locked");
    expect(moveCourse(locked, { term: "1269", index: 0 }, { term: "1273", index: 0 })).toBe(locked);

    const dup = addCourse(addCourse(base(), "1269", 7), "1273", 7);
    expect(moveCourse(dup, { term: "1269", index: 0 }, { term: "1273", index: 0 })).toBe(dup);
  });

  it("moves a course to another term, creating the semester if needed", () => {
    let p = addCourse(base(), "1269", 1);
    p = moveCourseToTerm(p, "1269", 1, "1273");
    expect(ids(p, "1273")).toEqual([1]);
    p = moveCourseToTerm(p, "1273", 1, "1319"); // Fall 2031, beyond the plan
    expect(ids(p, "1319")).toEqual([1]);
    expect(p.semesters.at(-1)!.index).toBe("1319");
  });

  it("removes a course", () => {
    const p = removeCourse(addCourse(base(), "1269", 1), "1269", 1);
    expect(ids(p, "1269")).toEqual([]);
  });
});

describe("semester and year edits", () => {
  it("adds the next semester after the last one", () => {
    const p = addNextSemester(base());
    expect(p.semesters.at(-1)!.index).toBe("1309"); // last was Summer 2030 → Fall 2030
  });

  it("skips hidden seasons when adding the next semester (review of #19)", () => {
    const p = removeSemester(base(), "1305"); // plan now ends Spring 2030
    expect(addNextSemester(p, ["summer"]).semesters.at(-1)!.index).toBe("1309");
    expect(addNextSemester(p).semesters.at(-1)!.index).toBe("1305");
  });

  it("adds whole years at either end", () => {
    expect(addYearAtEnd(base()).semesters.slice(-3).map((s) => s.index)).toEqual(["1309", "1313", "1315"]);
    expect(addYearAtStart(base()).semesters.slice(0, 3).map((s) => s.index)).toEqual(["1259", "1263", "1265"]);
  });

  it("removes and re-adds a single semester", () => {
    let p = removeSemester(base(), "1275");
    expect(missingTermsInYear(p, 2026)).toEqual(["1275"]);
    p = addSemester(p, "1275");
    expect(missingTermsInYear(p, 2026)).toEqual([]);
  });

  it("removes a whole academic year", () => {
    const p = removeYear(base(), 2026);
    expect(p.semesters[0].index).toBe("1279");
    expect(p.semesters).toHaveLength(9);
  });

  it("groups semesters by academic year", () => {
    const g = groupByYear(base().semesters);
    expect(g).toHaveLength(4);
    expect(g[0]).toMatchObject({ startYear: 2026 });
    expect(g[0].semesters.map((s) => s.index)).toEqual(["1269", "1273", "1275"]);
  });
});

it("sums credit ranges", () => {
  expect(sumCredits([{ min: 4, max: 4 }, { min: 1, max: 3 }])).toEqual({ min: 5, max: 7 });
});
