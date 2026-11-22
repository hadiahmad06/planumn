import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { findCourseIdsByCode, getCourses, parseSrt } from "./courses";
import { catalog } from "./db";
import { CATALOG_DATA_THROUGH } from "@/domain/dataSources";
import { termLabel } from "@/domain/terms";
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

describe("parseSrt", () => {
  it("reads GopherGrades' flat means with one respondent total", () => {
    expect(parseSrt('{"RECC": 4.6, "EFFORT": 4.8, "RESP": 1989.0}')).toEqual({
      RECC: { value: 4.6, respondents: 1989 },
      EFFORT: { value: 4.8, respondents: 1989 },
    });
    expect(parseSrt(null)).toEqual({});
    expect(parseSrt("null")).toEqual({});
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

  it("keeps every 2025 course id on the same campus, subject and number (D1, #97)", () => {
    // 2025 plans and the e2e suite (CSCI 1933/2011/2041 = 94/77/1473) use these ids. Fingerprint of ids
    // 1–9,731 in the 2025 build. Breaking changes are permitted (Hadi, 2026-11-22): a refresh that
    // changes an id updates this on purpose, and scripts/build-catalog.ts lists the changed ids.
    const rows = catalog()
      .prepare("SELECT id, campus, dept_abbr, course_num FROM classdistribution WHERE id <= 9731 ORDER BY id")
      .all() as { id: number; campus: string; dept_abbr: string; course_num: string }[];
    expect(rows).toHaveLength(9731);
    const text = rows.map((r) => `${r.id}|${r.campus}|${r.dept_abbr}|${r.course_num}`).join("\n");
    expect(createHash("sha256").update(text).digest("hex")).toBe("913793c6ff66d80b93a601531e98b479bae7f11788f57b1af554a27951f01dda");
  });

  it("maps course group ids at least as well as the 2025 build (9,486 rows; 8,339 Twin Cities)", () => {
    const n = (sql: string) => (catalog().prepare(sql).get() as { n: number }).n;
    expect(n("SELECT COUNT(*) AS n FROM classdistribution WHERE id <= 9731 AND courseGroupId IS NOT NULL")).toBeGreaterThanOrEqual(9486);
    expect(n("SELECT COUNT(*) AS n FROM classdistribution WHERE id <= 9731 AND campus = 'UMNTC' AND courseGroupId IS NOT NULL")).toBeGreaterThanOrEqual(8339);
  });

  it("says the data runs through the last term with grade records", () => {
    const { hi } = catalog().prepare("SELECT MAX(term) AS hi FROM termdistribution").get() as { hi: number };
    expect(CATALOG_DATA_THROUGH).toBe(termLabel(String(hi)));
  });

  it("takes Lib Ed tags from the UMN catalog, not the old wrong tags", () => {
    const id = findCourseIdsByCode([{ dept: "ECON", number: "1101" }]).get("ECON 1101")!;
    expect(getCourses([id])[0].libEds).not.toContain("Historical Perspectives"); // #46
  });

  it("skips unknown ids and maps codes to ids", () => {
    expect(getCourses([999999999])).toEqual([]);
    expect(findCourseIdsByCode([{ dept: "csci", number: "1133" }]).get("CSCI 1133")).toBe(87);
  });
});
