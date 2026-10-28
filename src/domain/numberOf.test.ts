import { describe, expect, it } from "vitest";
import { normalizeProgram, type RawProgram } from "@/server/programs/normalize";
import { pickCourses } from "./autofill";
import { evaluateRule, evaluateProgram, type CoursesRule, type GroupRule, type Program } from "./requirements";

// Phase C, C1: "complete N of these" rules (CourseDog numberOf) and rule descriptions. Shapes follow EE
// B.E.E.'s "Breadth and Depth" (number 4 areas, restriction 5 courses); course ids are made up.
const opt = (courseId: number) => ({ groupId: String(courseId), courseId, code: `EE ${courseId}`, title: null, credits: null });
const area = (id: string, ids: number[]): CoursesRule => ({
  kind: "courses",
  id,
  name: id,
  notes: null,
  choices: ids.map((i) => ({ options: [opt(i)] })),
  minCourses: 1,
  minCredits: 0,
});
const breadth: GroupRule = {
  kind: "numberOf",
  id: "bd",
  name: "Breadth and Depth",
  notes: null,
  count: 4,
  totalCourses: 5,
  // Course 50 is listed in two areas (like EE 4161W) but may count in only one.
  children: [area("controls", [10, 11, 50]), area("vlsi", [20, 21]), area("power", [30, 50]), area("rf", [40, 41]), area("digital", [60])],
};
const planned = (ids: number[]) => ids.map((courseId) => ({ courseId, credits: 4 }));

describe("numberOf rules (C1)", () => {
  it("counts areas by matching: a course shared by two areas covers only one", () => {
    const r = evaluateRule(breadth, planned([50, 20, 40]));
    expect(r).toMatchObject({ areas: 3, coursesCount: 3, satisfied: false, units: 1, filled: 0 });
  });

  it("needs both N areas and the course total", () => {
    expect(evaluateRule(breadth, planned([10, 20, 30, 40]))).toMatchObject({ areas: 4, coursesCount: 4, satisfied: false });
    expect(evaluateRule(breadth, planned([10, 11, 20, 30, 40]))).toMatchObject({ areas: 4, coursesCount: 5, satisfied: true, filled: 1 });
    expect(evaluateRule(breadth, planned([10, 11, 50, 20, 21]))).toMatchObject({ areas: 3, coursesCount: 5, satisfied: false });
  });

  it("autofill completes children until N are covered", () => {
    const program: Program = { id: "P", name: "EE", type: "Major", requirements: [{ id: "r", name: "r", notes: null, rules: [breadth] }] };
    const { picks } = pickCourses([evaluateProgram(program, [])], new Set());
    expect(picks.map((p) => p.courseId)).toHaveLength(4);
  });
});

describe("normalizeProgram reads numberOf and descriptions (C1)", () => {
  const raw: RawProgram = {
    programGroupId: "P",
    name: "Test",
    requisites: {
      requisitesSimple: [
        {
          id: "g",
          name: "Technical Electives",
          rules: [
            {
              id: "top",
              condition: "allOf",
              name: "Technical Electives",
              description: "<p>Students must complete 34 total technical elective credits, with a minimum of 22 from the Core.</p>",
              subRules: [
                {
                  id: "bd",
                  condition: "numberOf",
                  number: 4,
                  restriction: 5,
                  minCourses: 5,
                  name: "Breadth and Depth",
                  subRules: [{ id: "a", condition: "completeVariableCoursesAndVariableCredits", minCourses: 1, name: "Controls", value: { condition: "courses", values: [{ value: ["0000001"], logic: "or" }] } }],
                },
              ],
            },
          ],
        },
      ],
    },
  };
  const program = normalizeProgram(raw, (groupId) => ({ groupId, courseId: Number(groupId), code: null, title: null, credits: null }));
  const top = program.requirements[0].rules[0] as GroupRule;

  it("keeps the description as text", () => {
    expect(top.description).toBe("Students must complete 34 total technical elective credits, with a minimum of 22 from the Core.");
  });

  it("turns numberOf into a group with its count and course total, children intact", () => {
    const bd = top.children[0] as GroupRule;
    expect(bd).toMatchObject({ kind: "numberOf", count: 4, totalCourses: 5 });
    expect((bd.children[0] as CoursesRule).choices[0].options[0].courseId).toBe(1);
    expect("description" in bd).toBe(false);
  });
});
