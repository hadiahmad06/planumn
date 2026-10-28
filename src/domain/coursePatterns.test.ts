import { describe, expect, it } from "vitest";
import { describePattern, matchesPattern, readCoursePattern } from "./coursePatterns";

// Phase C/C3. Phrases from CourseDog rule names, notes and descriptions (trimmed).
const subjects = (text: string) => readCoursePattern(text)?.subjects.map((s) => `${s.subject} ${s.levels.join(",")}`);

describe("readCoursePattern (C3)", () => {
  it("reads subject-first patterns, lists and ranges", () => {
    expect(subjects("APEC 3xxx APEC 4xxx APEC 5xxx")).toEqual(["APEC 3,4,5"]);
    expect(subjects("ANTH 4xxx-5xxx")).toEqual(["ANTH 4,5"]);
    expect(subjects("with ANTH 4xxx or ANTH 5xxx")).toEqual(["ANTH 4,5"]);
    expect(subjects("ARCH 3XXX ARCH 4XXX")).toEqual(["ARCH 3,4"]);
    expect(subjects("EE 5000 level coursework")).toEqual(["EE 5"]);
    expect(subjects("CI 3xxx-5xxx")).toEqual(["CI 3,4,5"]);
  });

  it("keeps each subject's own levels in a list of designators", () => {
    expect(subjects("ACCT 5XXX BLAW 3XXX FINA 4XXX FINA 5XXX")).toEqual(["ACCT 5", "BLAW 3", "FINA 4,5"]);
  });

  it("reads level-first patterns with one or more subjects", () => {
    expect(subjects("Complete additional 4xxx/5xxx EE courses to meet the minimum 22 credits")).toEqual(["EE 4,5"]);
    expect(subjects("Complete additional 4xxx/5xxx EE and/or 4xxx/5xxx CSCI courses")).toEqual(["EE 4,5", "CSCI 4,5"]);
    expect(subjects("Additional 4xxx/5xxx EE/CSCI courses")).toEqual(["EE 4,5", "CSCI 4,5"]);
  });

  it("reads 'or higher' up to 8xxx", () => {
    expect(subjects("Any 4xxx or higher ESCI course not required elsewhere")).toEqual(["ESCI 4,5,6,7,8"]);
  });

  it("reads 'xxxx' as any subject", () => {
    expect(subjects("xxxx 3xxx xxxx 4xxx xxxx 5xxx")).toEqual(["* 3,4,5"]);
  });

  it("ignores lowercase words, bare levels, 'non-' subjects and real course numbers", () => {
    expect(readCoursePattern("4xxx or higher electives offered by the Department of Earth Sciences")).toBeNull();
    expect(readCoursePattern("Earn at least 15 credits from the following: 3xxx or higher first concentration")).toBeNull();
    expect(readCoursePattern("Non-EE 4000 level coursework--maximum of 12 credits total.")).toBeNull();
    expect(readCoursePattern("Take ENGL 3000 or ENGL 3001.")).toBeNull();
    expect(readCoursePattern("1xxx Art Electives")).toBeNull();
  });

  it("doesn't read caps as course lists", () => {
    expect(readCoursePattern("Students may not exceed a combined 16 credits total of coursework of EE 5000 level graduate coursework.")).toBeNull();
    expect(readCoursePattern("EE 4000 level EE coursework--maximum of 6 credits.")).toBeNull();
  });

  it("rules out 'non-' subjects", () => {
    const p = readCoursePattern("Upper-Division Electives: non-ARCH xxxx 3xxx xxxx 4xxx")!;
    expect(p.exceptSubjects).toEqual(["ARCH"]);
    expect(matchesPattern(p, "ARCH 3150")).toBe(false);
    expect(matchesPattern(p, "HIST 3001")).toBe(true);
  });

  it("reads exclusions and inclusions", () => {
    const p = readCoursePattern("ACCT 5XXX FINA 3XXX Excluding: ACCT 2051, ACCT 2051H, FINA 3001, Law 3050, and SCO 3001")!;
    expect(p.excluded).toEqual(["ACCT 2051", "ACCT 2051H", "FINA 3001", "LAW 3050", "SCO 3001"]);
    const ee = readCoursePattern("additional 4xxx/5xxx EE courses. Excludes EE 4981H. Includes CSCI 4203.")!;
    expect(ee.excluded).toEqual(["EE 4981H"]);
    expect(ee.included).toEqual(["CSCI 4203"]);
  });
});

describe("matchesPattern (C3)", () => {
  const ee = readCoursePattern("additional 4xxx/5xxx EE courses. Excludes EE 4981H. Includes CSCI 4203.")!;
  it("matches subject and level, honoring exclusions and inclusions", () => {
    expect(matchesPattern(ee, "EE 4389W")).toBe(true);
    expect(matchesPattern(ee, "EE 5231")).toBe(true);
    expect(matchesPattern(ee, "EE 3015")).toBe(false);
    expect(matchesPattern(ee, "CSCI 4041")).toBe(false);
    expect(matchesPattern(ee, "EE 4981H")).toBe(false);
    expect(matchesPattern(ee, "CSCI 4203")).toBe(true);
  });

  it("matches any subject for 'xxxx'", () => {
    const any = readCoursePattern("xxxx 3xxx")!;
    expect(matchesPattern(any, "HIST 3001")).toBe(true);
    expect(matchesPattern(any, "HIST 2001")).toBe(false);
  });
});

describe("describePattern (C3)", () => {
  it("groups subjects that share levels", () => {
    expect(describePattern(readCoursePattern("4xxx/5xxx EE/CSCI")!)).toBe("EE or CSCI 4xxx/5xxx");
    expect(describePattern(readCoursePattern("APEC 3xxx APEC 4xxx APEC 5xxx")!)).toBe("APEC 3xxx–5xxx");
    expect(describePattern(readCoursePattern("xxxx 3xxx")!)).toBe("any subject 3xxx");
  });
});
