import { describe, expect, it } from "vitest";
import { findCourseIdsByCode, getCourses } from "./courses";
import { parseQuery, searchCourses } from "./search";

describe("parseQuery", () => {
  it("recognizes course codes, numbers, departments and title words", () => {
    expect(parseQuery("csci 2041")).toEqual({ dept: "CSCI", number: "2041", words: [] });
    expect(parseQuery("csci2041h")).toEqual({ dept: "CSCI", number: "2041H", words: [] });
    expect(parseQuery("2041")).toEqual({ dept: null, number: "2041", words: [] });
    expect(parseQuery("math")).toEqual({ dept: "MATH", number: null, words: ["MATH"] });
    expect(parseQuery("discrete structures")).toEqual({ dept: null, number: null, words: ["DISCRETE", "STRUCTURES"] });
  });
});

describe("catalog (data/catalog.db)", () => {
  it("finds a course by exact code first", () => {
    const [first] = searchCourses("csci 2011");
    expect(first).toMatchObject({ id: 77, dept: "CSCI", number: "2011", credits: { min: 4, max: 4 } });
  });

  it("searches titles and only returns Twin Cities courses", () => {
    const results = searchCourses("discrete structures");
    expect(results.some((r) => r.id === 77)).toBe(true);
  });

  it("returns details with grades, Lib Eds and offered terms", () => {
    const [c] = getCourses([77]);
    expect(c.title).toBe("Discrete Structures of Computer Science");
    expect(c.courseGroupId).toBe("0036721");
    expect(c.totalStudents).toBeGreaterThan(0);
    expect(Object.keys(c.grades)).toContain("A");
    expect(c.termsOffered[0]).toBe("1175");
    expect(c.srt.DEEP_UND.respondents).toBeGreaterThan(0);
    expect(getCourses([1004])[0].prereqText).toBeTruthy(); // CSCI 2021
  });

  it("maps Lib Ed designations to the right course (left_id = libed, right_id = course)", () => {
    const [wi] = getCourses([findCourseIdsByCode([{ dept: "CSCI", number: "3081W" }]).get("CSCI 3081W")!]);
    expect(wi.libEds).toContain("Writing Intensive");
  });

  it("skips unknown ids and maps codes to ids", () => {
    expect(getCourses([999999999])).toEqual([]);
    expect(findCourseIdsByCode([{ dept: "csci", number: "1133" }]).get("CSCI 1133")).toBe(87);
  });
});
