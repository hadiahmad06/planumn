import { describe, expect, it } from "vitest";
import { getCourses } from "./courses";
import { courseFacts } from "./facts";
import { searchCourses } from "./search";

describe("filtered catalog search (B8)", () => {
  it("allows an empty query when a filter is set, and caps results at the limit", () => {
    expect(searchCourses("", 50)).toEqual([]);
    const results = searchCourses("", 20, { level: 1000 });
    expect(results).toHaveLength(20);
    expect(results.every((c) => c.number.startsWith("1"))).toBe(true);
  });

  it("combines a query with filters", () => {
    const csci = searchCourses("csci", 100, { level: 4000, credits: 3 });
    expect(csci.length).toBeGreaterThan(0);
    expect(csci.every((c) => c.dept === "CSCI" && c.number.startsWith("4") && c.credits.min <= 3 && c.credits.max >= 3)).toBe(true);
  });

  it("filters by offering season, GPA and prerequisites from the catalog", () => {
    const facts = courseFacts();
    for (const c of searchCourses("", 100, { season: "summer", minGpa: 3.5, noPrereqs: true })) {
      const f = facts.get(c.id)!;
      expect(f.seasons).toContain("summer");
      expect(f.gpa).toBeGreaterThanOrEqual(3.5);
      expect(f.hasPrereqs).toBe(false);
    }
    // CSCI 2021 has prerequisites.
    expect(searchCourses("csci 2021", 10, { noPrereqs: true }).some((c) => c.id === 1004)).toBe(false);
  });

  it("restricts to the given course ids (satisfies requirement X)", () => {
    expect(searchCourses("", 50, { courseIds: [77, 1473, 1004] }).map((c) => c.id).sort((a, b) => a - b)).toEqual([77, 1004, 1473]);
    expect(searchCourses("discrete", 50, { courseIds: [77, 1473] }).map((c) => c.id)).toEqual([77]);
    // Combines with other filters: CSCI 2021 (1004) has prerequisites.
    expect(searchCourses("", 50, { courseIds: [77, 1004], noPrereqs: true }).map((c) => c.id)).not.toContain(1004);
    expect(searchCourses("csci", 50, { courseIds: [] })).toEqual([]);
  });

  it("restricts to the given Lib Ed course groups", () => {
    const [discrete] = getCourses([77]);
    const only = searchCourses("csci", 100, { libEd: "GP" }, new Set([discrete.courseGroupId!]));
    expect(only.map((c) => c.id)).toEqual([77]);
    expect(searchCourses("csci", 100, { libEd: "GP" }, new Set())).toEqual([]);
  });
});
