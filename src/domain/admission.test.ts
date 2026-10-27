import { describe, expect, it } from "vitest";
import { admissionChecklist } from "./admission";
import type { Semester } from "./plan";
import { evaluateProgram, type CoursesRule, type Program } from "./requirements";

const opt = (courseId: number) => ({ groupId: String(courseId), courseId, code: null, title: null, credits: null });
const courses = (id: string, ids: number[], minCourses: number): CoursesRule => ({
  kind: "courses",
  id,
  name: id,
  notes: null,
  choices: ids.map((i) => ({ options: [opt(i)] })),
  minCourses,
  minCredits: 0,
});
const program: Program = {
  id: "M",
  name: "M B.S.",
  type: "Major",
  admissionNotes: "Students with a 3.2 technical GPA are guaranteed admission.",
  admissionLinks: [{ label: "application website", url: "https://cse.umn.edu/cs/bs-application" }],
  requirements: [
    { id: "calc", name: "Mathematics Core", notes: null, rules: [courses("calc", [1, 2], 2)], level: "admission" },
    { id: "intro", name: "CS Intro", notes: null, rules: [courses("intro", [3], 1)], level: "admission" },
    { id: "core", name: "Core", notes: null, rules: [courses("core", [4], 1)] },
  ],
};
const sem = (index: string, ids: number[], kind?: Semester["kind"]): Semester => ({ index, courses: ids.map((id) => ({ id, lock: "unlocked" })), ...(kind ? { kind } : {}) });
const check = (semesters: Semester[]) => {
  const planned = [...new Set(semesters.flatMap((s) => s.courses.map((c) => c.id)))].map((courseId) => ({ courseId, credits: 4 }));
  return admissionChecklist(evaluateProgram(program, planned), semesters)!;
};

describe("admission checklist (B26)", () => {
  it("lists only admission-level requirements, with the catalog text and links", () => {
    const c = check([sem("1269", [1])]);
    expect(c.items.map((i) => i.result.requirement.name)).toEqual(["Mathematics Core", "CS Intro"]);
    expect(c.notes).toMatch(/3\.2/);
    expect(c.links[0].url).toBe("https://cse.umn.edu/cs/bs-application");
    expect(c).toMatchObject({ met: 0, plannedBy: null });
  });

  it("dates each covered requirement by its latest course, and the whole list by the latest item", () => {
    const c = check([sem("1269", [1, 3]), sem("1273", [2]), sem("1279", [4])]);
    expect(c.items.map((i) => i.plannedBy)).toEqual(["1273", "1269"]);
    expect(c).toMatchObject({ met: 2, plannedBy: "1273" });
  });

  it("reports prior credit (AP/IB/transfer) as such, and the first term a repeated course appears in", () => {
    const c = check([sem("1265", [1, 2], "prior"), sem("1269", [3]), sem("1273", [3])]);
    expect(c.items.map((i) => i.plannedBy)).toEqual(["prior", "1269"]);
  });

  it("is null for a program without admission requirements or text", () => {
    const plain: Program = { ...program, admissionNotes: null, requirements: program.requirements.map((r) => ({ ...r, level: undefined })) };
    expect(admissionChecklist(evaluateProgram(plain, []), [])).toBeNull();
  });

  it("keeps text-only admission rules (Nursing lists its prerequisites in prose)", () => {
    const prose: Program = { ...program, requirements: [program.requirements[2]] };
    const c = admissionChecklist(evaluateProgram(prose, []), [])!;
    expect(c.items).toEqual([]);
    expect(c.notes).toMatch(/guaranteed/);
  });
});
