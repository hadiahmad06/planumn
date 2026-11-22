import { describe, expect, it } from "vitest";
import { getCourses } from "./courses";
import { courseFacts } from "./facts";
import { searchCourses } from "./search";

describe("filtered catalog search (B8)", () => {
  it("allows an empty query when a filter is set, and caps results at the limit", async () => {
    expect((await searchCourses("", 50))).toEqual([]);
    const results = (await searchCourses("", 20, { level: 1000 }));
    expect(results).toHaveLength(20);
    expect(results.every((c) => c.number.startsWith("1"))).toBe(true);
  });

  it("combines a query with filters", async () => {
    const csci = (await searchCourses("csci", 100, { level: 4000, credits: 3 }));
    expect(csci.length).toBeGreaterThan(0);
    expect(csci.every((c) => c.dept === "CSCI" && c.number.startsWith("4") && c.credits.min <= 3 && c.credits.max >= 3)).toBe(true);
  });

  it("filters by offering season, GPA and prerequisites from the catalog", async () => {
    const facts = await courseFacts();
    for (const c of (await searchCourses("", 100, { season: "summer", minGpa: 3.5, noPrereqs: true }))) {
      const f = facts.get(c.id)!;
      expect(f.seasons).toContain("summer");
      expect(f.gpa).toBeGreaterThanOrEqual(3.5);
      expect(f.hasPrereqs).toBe(false);
    }
    // CSCI 2021 has prerequisites.
    expect((await searchCourses("csci 2021", 10, { noPrereqs: true })).some((c) => c.id === 1004)).toBe(false);
  });

  it("restricts to the given course ids (satisfies requirement X)", async () => {
    expect((await searchCourses("", 50, { courseIds: [77, 1473, 1004] })).map((c) => c.id).sort((a, b) => a - b)).toEqual([77, 1004, 1473]);
    expect((await searchCourses("discrete", 50, { courseIds: [77, 1473] })).map((c) => c.id)).toEqual([77]);
    // Combines with other filters: CSCI 2021 (1004) has prerequisites.
    expect((await searchCourses("", 50, { courseIds: [77, 1004], noPrereqs: true })).map((c) => c.id)).not.toContain(1004);
    expect((await searchCourses("csci", 50, { courseIds: [] }))).toEqual([]);
  });

  it("restricts to the given Lib Ed course groups", async () => {
    const [discrete] = (await getCourses([77]));
    const only = (await searchCourses("csci", 100, { libEd: "GP" }, new Set([discrete.courseGroupId!])));
    expect(only.map((c) => c.id)).toEqual([77]);
    expect((await searchCourses("csci", 100, { libEd: "GP" }, new Set()))).toEqual([]);
  });
});
