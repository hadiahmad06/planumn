import { describe, expect, it } from "vitest";
import { filtersToParams, hasFilters, levelOf, matchesFilters, parseFilters, type CourseFacts } from "./searchFilters";

const course: CourseFacts = { number: "3081W", credits: { min: 3, max: 4 }, seasons: ["fall", "spring"], gpa: 3.4, hasPrereqs: true };

describe("search filters (B8)", () => {
  it("round-trips through query params", () => {
    const f = { libEd: "GP", season: "fall" as const, level: 3000, credits: 4, minGpa: 3.5, noPrereqs: true };
    expect(parseFilters(filtersToParams(f))).toEqual(f);
    expect(filtersToParams({}).toString()).toBe("");
    expect(hasFilters({})).toBe(false);
    expect(hasFilters({ noPrereqs: false })).toBe(false);
    expect(hasFilters({ level: 1000 })).toBe(true);
  });

  it("round-trips course ids, including an empty list", () => {
    expect(parseFilters(filtersToParams({ courseIds: [1473, 77] }))).toEqual({ courseIds: [77, 1473] });
    expect(parseFilters(filtersToParams({ courseIds: [] }))).toEqual({ courseIds: [] });
    expect(hasFilters({ courseIds: [] })).toBe(true);
    expect(parseFilters(new URLSearchParams("ids=77,77,1473"))).toEqual({ courseIds: [77, 1473] });
  });

  it("rejects invalid values", () => {
    for (const q of ["libed=XYZ", "season=winter", "level=2500", "credits=-1", "credits=x", "minGpa=5", "ids=1,abc", "ids=0", `ids=${Array.from({ length: 1001 }, (_, i) => i + 1).join(",")}`])
      expect(parseFilters(new URLSearchParams(q))).toHaveProperty("error");
  });

  it("buckets 5000+ courses together", () => {
    expect(levelOf("1001")).toBe(1000);
    expect(levelOf("3081W")).toBe(3000);
    expect(levelOf("8980")).toBe(5000);
  });

  it("applies each filter", () => {
    expect(matchesFilters(course, {})).toBe(true);
    expect(matchesFilters(course, { level: 3000 })).toBe(true);
    expect(matchesFilters(course, { level: 4000 })).toBe(false);
    expect(matchesFilters(course, { credits: 4 })).toBe(true);
    expect(matchesFilters(course, { credits: 2 })).toBe(false);
    expect(matchesFilters(course, { season: "spring" })).toBe(true);
    expect(matchesFilters(course, { season: "summer" })).toBe(false);
    expect(matchesFilters({ ...course, seasons: null }, { season: "fall" })).toBe(false);
    expect(matchesFilters(course, { minGpa: 3.25 })).toBe(true);
    expect(matchesFilters(course, { minGpa: 3.5 })).toBe(false);
    expect(matchesFilters({ ...course, gpa: null }, { minGpa: 2 })).toBe(false);
    expect(matchesFilters(course, { noPrereqs: true })).toBe(false);
    expect(matchesFilters({ ...course, hasPrereqs: false }, { noPrereqs: true })).toBe(true);
  });
});
