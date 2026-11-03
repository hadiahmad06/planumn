import { describe, expect, it } from "vitest";
import type { CourseDetails } from "./course";
import { currentTerm, healthCheck, offeredInSeason, offeringHistory, pacing } from "./health";
import { createEmptyPlan, type Plan } from "./plan";
import { addCourse, addSemester, setLock } from "./planOps";

const course = (id: number, credits: number, termsOffered: string[], dept = "CSCI", number = String(1000 + id)): CourseDetails => ({
  id,
  dept,
  number,
  title: `Course ${id}`,
  credits: { min: credits, max: credits },
  description: "",
  catalogUrl: null,
  courseGroupId: null,
  grades: {},
  totalStudents: 0,
  srt: {},
  libEds: [],
  termsOffered,
  prereqText: null,
});
const plan = (): Plan => createEmptyPlan(new Date(2026, 3, 1)); // Fall 2026 … Summer 2030
const now = new Date(2026, 9, 27);

describe("offering history (B4)", () => {
  it("needs 3+ terms before judging", () => {
    expect(offeringHistory(["1229", "1239"]).known).toBe(false);
    expect(offeredInSeason(offeringHistory(["1229"]), "1273")).toBe(true);
  });

  it("flags a season the course has never run in", () => {
    const fallOnly = offeringHistory(["1219", "1229", "1239", "1249"]);
    expect(offeredInSeason(fallOnly, "1279")).toBe(true);
    expect(offeredInSeason(fallOnly, "1273")).toBe(false);
  });
});

describe("pacing (B5)", () => {
  it("counts each course once, finds the last planned term, compares to 120", () => {
    let p = addCourse(plan(), "1269", 1);
    p = addCourse(p, "1273", 2);
    p = addCourse(p, "1279", 1); // retake: credits counted once
    const r = pacing(p, (id) => (id === 1 ? 4 : 3));
    expect(r).toMatchObject({ credits: 7, remaining: 113, finalTerm: "1279", enough: false });
  });
});

describe("health check (B6)", () => {
  it("reports offering, load and total-credit issues, skipping locked courses", () => {
    const courses = { 1: course(1, 4, ["1219", "1229", "1239"]), 2: course(2, 20, ["1213", "1223", "1233"]), 3: course(3, 4, ["1213", "1223", "1233"]) };
    let p = addCourse(plan(), "1273", 1); // fall-only course in Spring
    p = addCourse(p, "1279", 2); // 20 credits in Fall 2027: heavy
    p = addCourse(p, "1283", 3); // 4 credits in Spring 2028: light
    p = addCourse(addSemester(p, "1263"), "1263", 1); // past term (the semester has to exist first)
    p = setLock(p, "1263", 1, "locked");
    const kinds = healthCheck({ plan: p, courses, prereqs: new Map(), now }).map((i) => `${i.kind}:${i.term ?? ""}`);
    expect(kinds).toContain("offering:1273");
    expect(kinds).toContain("heavy:1279");
    expect(kinds).toContain("light:1283");
    expect(kinds).toContain("credits:");
    expect(kinds.some((k) => k.endsWith(":1263"))).toBe(false);
  });

  it("turns unmet prerequisites into warnings (soft when there are other ways in)", () => {
    const courses = { 1: course(1, 4, []) };
    const p = addCourse(plan(), "1269", 1);
    const prereqs = new Map([["1269:1", { met: false, missing: "CSCI 1933", hasOtherPaths: true }]]);
    const [issue] = healthCheck({ plan: p, courses, prereqs, now }).filter((i) => i.kind === "prereq");
    expect(issue).toMatchObject({ severity: "info", courseId: 1 });
  });
});

// Review fix by Ishaan's Claude (#33): load notes compare whole terms, not calendar years.
describe("current term (review of #33)", () => {
  it("maps months to the UMN term in progress", () => {
    expect(currentTerm(new Date(2026, 0, 15))).toBe("1263");
    expect(currentTerm(new Date(2026, 4, 31))).toBe("1263");
    expect(currentTerm(new Date(2026, 5, 1))).toBe("1265");
    expect(currentTerm(new Date(2026, 7, 31))).toBe("1265");
    expect(currentTerm(new Date(2026, 8, 1))).toBe("1269");
    expect(currentTerm(new Date(2026, 9, 27))).toBe("1269");
  });

  it("skips earlier seasons of this year and the term in progress, warns for upcoming ones", () => {
    const courses = { 1: course(1, 4, []), 2: course(2, 4, []), 3: course(3, 4, []) };
    let p = addSemester(plan(), "1263"); // Spring 2026, before Fall 2026 in the same calendar year
    p = addCourse(p, "1263", 1); // unlocked on purpose: the term itself is what's past
    p = addCourse(p, "1269", 2); // Fall 2026, in progress on Oct 27
    p = addCourse(p, "1273", 3); // Spring 2027, upcoming
    expect(p.semesters.some((s) => s.index === "1263")).toBe(true);
    const light = healthCheck({ plan: p, courses, prereqs: new Map(), now })
      .filter((i) => i.kind === "light")
      .map((i) => i.term);
    expect(light).toEqual(["1273"]);
  });

  it("still warns about this Fall in April, before it starts", () => {
    const courses = { 1: course(1, 4, []) };
    const p = addCourse(plan(), "1269", 1);
    const light = healthCheck({ plan: p, courses, prereqs: new Map(), now: new Date(2026, 3, 1) }).filter((i) => i.kind === "light");
    expect(light.map((i) => i.term)).toEqual(["1269"]);
  });
});
