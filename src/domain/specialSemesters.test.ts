import { describe, expect, it } from "vitest";
import { createEmptyPlan, normalizeSemesters, type Plan } from "./plan";
import { setSemesterKind } from "./planOps";

// Written by Ishaan's Claude (B19 special semesters).
const plan = (): Plan => createEmptyPlan(new Date(2026, 3, 1)); // Fall 2026 = "1269"
const sem = (p: Plan, term: string) => p.semesters.find((s) => s.index === term)!;

describe("special semesters (B19)", () => {
  it("marks and unmarks a term; regular semesters have no kind field (2025 shape)", () => {
    let p = setSemesterKind(plan(), "1273", "abroad");
    expect(sem(p, "1273").kind).toBe("abroad");
    expect(setSemesterKind(p, "1273", "abroad")).toBe(p);
    p = setSemesterKind(p, "1273", null);
    expect("kind" in sem(p, "1273")).toBe(false);
    expect(sem(p, "1273")).toEqual({ index: "1273", courses: [] });
  });

  it("keeps the kind through normalization", () => {
    const s = normalizeSemesters([{ index: "1275", courses: [], kind: "coop" }]);
    expect(s[0].kind).toBe("coop");
  });
});

describe("health check with special semesters (B19)", () => {
  it("skips load notes for special terms and flags a leave with courses", async () => {
    const { healthCheck } = await import("./health");
    const { addCourse } = await import("./planOps");
    const course = (id: number) => ({
      id, dept: "CSCI", number: String(1000 + id), title: "x", credits: { min: 4, max: 4 }, description: "", catalogUrl: null,
      courseGroupId: null, grades: {}, totalStudents: 0, srt: {}, libEds: [], termsOffered: [], prereqText: null,
    });
    let p = addCourse(plan(), "1273", 1); // Spring 2027, 4 cr: part-time
    p = addCourse(p, "1279", 2); // Fall 2027 abroad, 4 cr
    p = addCourse(p, "1283", 3); // Spring 2028 leave, 4 cr
    p = setSemesterKind(setSemesterKind(p, "1279", "abroad"), "1283", "leave");
    const issues = healthCheck({ plan: p, courses: { 1: course(1), 2: course(2), 3: course(3) }, prereqs: new Map(), now: new Date(2026, 9, 27) });
    const kinds = issues.map((i) => `${i.kind}:${i.term ?? ""}`);
    expect(kinds).toContain("light:1273");
    expect(kinds).not.toContain("light:1279");
    expect(kinds).not.toContain("light:1283");
    expect(kinds).toContain("leave:1283");
  });
});
