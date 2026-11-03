import { describe, expect, it } from "vitest";
import { evaluateProgram, type CoursesRule, type GroupRule } from "@/domain/requirements";
import fixture from "./__fixtures__/cs-bs.json";
import { collectGroupIds, htmlLinks, htmlToText, normalizeProgram, pickCurrentVersion, type RawProgram } from "./normalize";

// Real CourseDog response for Computer Science B.S. (version 2026-09-08, all requirements; unread fields stripped).
const raw = pickCurrentVersion(fixture as unknown as Record<string, RawProgram>)!;
// Pretend every 7-digit id is in the catalog with id = Number(groupId).
const program = normalizeProgram(raw, (groupId) => ({
  groupId,
  courseId: /^\d{7}$/.test(groupId) ? Number(groupId) : null,
  code: null,
  title: null,
  credits: { min: 4, max: 4 },
}));
const req = (name: string) => program.requirements.find((r) => r.name === name)!;

describe("normalizeProgram (CourseDog CS B.S.)", () => {
  it("reads program metadata and every requirement", () => {
    expect(program).toMatchObject({ id: "019627107", type: "Major" });
    expect(program.requirements.map((r) => r.name)).toContain("Mathematics Core");
  });

  it("tags CourseDog's admission and sub-plan levels, and keeps the admission text and links (B26)", () => {
    expect(req("Mathematics Core").level).toBe("admission");
    expect(req("Computer Science Introductory Core").level).toBe("admission");
    expect(req("Computer Science Core").level).toBeUndefined();
    expect(req("Integrated Computer Science B.S./M.S. Program").level).toBe("subplan");
    expect(program.admissionNotes).toMatch(/3\.2 or above technical GPA/);
    expect(program.admissionLinks?.map((l) => l.url)).toEqual(["https://z.umn.edu/techgpa", "https://cse.umn.edu/cs/bs-application"]);
  });

  it("reads only https links, decoding entities in the label", () => {
    expect(htmlLinks('<a href="http://x.test">no</a> <a class="a" href="https://a.test/?b=1&amp;c=2">CS&amp;E site</a>')).toEqual([
      { label: "CS&E site", url: "https://a.test/?b=1&c=2" },
    ]);
  });

  it("turns minimumCredits rules into credit minimums with alternative options", () => {
    const calc = req("Mathematics Core").rules[0] as CoursesRule;
    expect(calc).toMatchObject({ kind: "courses", name: "Calculus I", minCredits: 4 });
    expect(calc.choices).toHaveLength(1);
    expect(calc.choices[0].options.map((o) => o.groupId)).toEqual(["0036921", "0001201", "0036961", "0148561"]);
    expect(calc.notes).toMatch(/MATH1471 is a 2-credit course/);
  });

  it("keeps anyOf structure for option-style requirements", () => {
    const intro = req("Computer Science Introductory Core").rules[0] as GroupRule;
    expect(intro.kind).toBe("anyOf");
    expect(intro.children.map((c) => c.name)).toEqual(["Option 1 (Preferred)", "Option 2", "Option 3"]);
    expect((intro.children[2] as CoursesRule).minCourses).toBe(3);
  });

  it("evaluates the real structure", () => {
    const planned = [8096661, 8103461, 36921].map((courseId) => ({ courseId, credits: 4 })); // CSCI 1133, 1933, MATH 1271
    const result = evaluateProgram(program, planned);
    const intro = result.requirements.find((r) => r.requirement.name === "Computer Science Introductory Core")!;
    expect(intro.satisfied).toBe(true);
    const math = result.requirements.find((r) => r.requirement.name === "Mathematics Core")!;
    expect(math).toMatchObject({ satisfied: false, filled: 1 });
  });

  it("keeps the deepest nesting: Linear Algebra → anyOf → allOf (MATH 4242 substitution)", () => {
    const core = req("Computer Science Core").rules[0] as GroupRule;
    expect(core.kind).toBe("allOf");
    const linear = core.children.find((c) => c.name === "Linear Algebra") as GroupRule;
    expect(linear.kind).toBe("anyOf");
    const sub = linear.children.find((c) => c.name.startsWith("Acceptable Substitutions with MATH 4242")) as GroupRule;
    expect(sub.kind).toBe("allOf");
    expect(sub.children).toHaveLength(2);
  });

  it("reads long single-course lists (Upper Division Math: any 1 of many)", () => {
    const tech = req("Technical Electives & Upper Division Math-Oriented Requirement").rules[0] as GroupRule;
    const math = tech.children.find((c) => c.name === "Upper Division Math-Oriented Requirement") as CoursesRule;
    expect(math.minCourses).toBe(1);
    expect(math.choices.length).toBeGreaterThan(5);
  });

  it("collects every course group id for batch lookup", () => {
    const ids = collectGroupIds(raw);
    expect(ids).toContain("0036721");
    expect(ids.some((id) => !/^\d+$/.test(id))).toBe(true); // opaque CourseDog ids exist too
  });
});

describe("helpers", () => {
  it("converts CourseDog HTML notes to text", () => {
    expect(htmlToText("<p>CSE &amp; Engineering</p><p>Second&nbsp;para</p>")).toBe("CSE & Engineering\nSecond para");
    expect(htmlToText("<p></p>")).toBeNull();
  });

  it("picks the newest version that has started", () => {
    const v = pickCurrentVersion({ a: { effectiveStartDate: "2024-09-01" }, b: { effectiveStartDate: "2025-01-21" }, c: { effectiveStartDate: "2099-01-01" } }, new Date("2026-10-26"));
    expect(v?.effectiveStartDate).toBe("2025-01-21");
  });
});
