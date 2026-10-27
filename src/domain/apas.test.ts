import { describe, expect, it } from "vitest";
import { apasOption, classifyApasCourse, parseApasCourseCode, parseApasTerm, parseApasTermLabel, parseUachieveTerm } from "./apas";

describe("APAS conversions (B1 step 2)", () => {
  it("reads report term codes", () => {
    expect(parseApasTerm("SP21")).toBe("1213");
    expect(parseApasTerm("F 22")).toBe("1229");
    expect(parseApasTerm("SU25")).toBe("1255");
    expect(parseApasTerm("XX25")).toBeNull();
    expect(parseApasTerm("")).toBeNull();
  });

  it("reads term labels and uAchieve yyyyt codes", () => {
    expect(parseApasTermLabel("Fall 2024")).toBe("1249");
    expect(parseApasTermLabel("Spr 2028")).toBe("1283");
    expect(parseApasTermLabel("Summer 2025")).toBe("1255");
    expect(parseUachieveTerm("20249 ")).toBe("1249");
    expect(parseUachieveTerm("2024")).toBeNull();
  });

  it("splits campus, padded subject and number", () => {
    expect(parseApasCourseCode("1CSCI1001")).toEqual({ campus: "1", code: "CSCI 1001" });
    expect(parseApasCourseCode("1EE  3101")).toEqual({ campus: "1", code: "EE 3101" });
    expect(parseApasCourseCode("1POL 1001")).toEqual({ campus: "1", code: "POL 1001" });
    expect(parseApasCourseCode("1PHYS1101W")).toEqual({ campus: "1", code: "PHYS 1101W" });
    expect(parseApasCourseCode("1NOTR0T001")).toEqual({ campus: "1", code: "NOTR 0T001" });
    expect(parseApasCourseCode("Course")).toBeNull();
    expect(apasOption("1EE  ", "4161 ")).toBe("EE 4161");
    expect(apasOption("1CSCI", "4***")).toBe("CSCI 4***");
  });

  it("classifies grades and condition codes", () => {
    const c = (grade: string, condition = "", credits = 4, notes: string[] = []) => classifyApasCourse({ grade, condition, credits, notes });
    expect(c("A")).toEqual({ kind: "completed", earnedCredit: true });
    expect(c("F")).toEqual({ kind: "completed", earnedCredit: false });
    expect(c("AF", "IP")).toEqual({ kind: "in-progress", earnedCredit: false });
    expect(c("SN")).toEqual({ kind: "in-progress", earnedCredit: false });
    expect(c("", "FT")).toEqual({ kind: "planned", earnedCredit: false });
    expect(c("W", "", 0)).toEqual({ kind: "withdrawn", earnedCredit: false });
    expect(c("T4", "", 4, ["AP EXAM: BIOL"])).toEqual({ kind: "exam", earnedCredit: true });
    expect(c("T", "", 4, ["SW STATE: CHEM232"])).toEqual({ kind: "transfer", earnedCredit: true });
    expect(c("N2", "", 0, ["AP EXAM: POLA"])).toEqual({ kind: "no-credit", earnedCredit: false });
  });
});
