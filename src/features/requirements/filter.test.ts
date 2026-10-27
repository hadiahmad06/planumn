import { describe, expect, it } from "vitest";
import type { Requirement } from "@/domain/requirements";
import { matchesFilter } from "./RequirementsRail";

const req: Requirement = {
  id: "r",
  name: "Mathematics Core",
  notes: null,
  rules: [
    {
      kind: "courses",
      id: "x",
      name: "Calculus I",
      notes: null,
      minCourses: 1,
      minCredits: 4,
      choices: [{ options: [{ groupId: "0036921", courseId: 1, code: "MATH 1271", title: "Calculus I", credits: { min: 4, max: 4 } }] }],
    },
  ],
};

describe("requirements filter (review of #21)", () => {
  it("matches names, codes and titles", () => {
    expect(matchesFilter(req, "math 1271")).toBe(true);
    expect(matchesFilter(req, "calculus")).toBe(true);
  });

  it("doesn't match JSON keys or CourseDog ids", () => {
    expect(matchesFilter(req, "credit")).toBe(false);
    expect(matchesFilter(req, "choices")).toBe(false);
    expect(matchesFilter(req, "0036921")).toBe(false);
  });
});
