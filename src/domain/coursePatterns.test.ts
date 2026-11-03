import { describe, expect, it } from "vitest";
import { describeTerm, matchesPattern, patternMatches, patternSearches, patternSearchLinks, readCoursePattern, type CoursePattern } from "./coursePatterns";

// Phase C/C3. Wording from CourseDog rule names, descriptions and notes (EE B.E.E., CompE B.Comp.E.,
// Geoengineering B.GeoE., Spanish Studies B.A., Architecture B.D.A., German B.A.; 2026-10-27 survey and the
// C0 coverage report), plus forms the survey named without a quoted example.
const read = (text: string | null, subjects?: string[]) => readCoursePattern(text, subjects ? { subjects: new Set(subjects) } : {});
const terms = (text: string, subjects?: string[]) => {
  const p = read(text, subjects);
  return p ? p.terms.map((t) => describeTerm(t, p.exceptSubjects)) : null;
};

const EE_NAME = "Complete additional 4xxx/5xxx EE courses to meet the minimum 22 credits of required Core Department Electives.";

describe("readCoursePattern (C3)", () => {
  it("reads SUBJ Nxxx lists and ranges", () => {
    expect(terms("SPAN 5xxx")).toEqual(["SPAN 5xxx"]);
    expect(terms("APEC 3xxx, 4xxx or 5xxx")).toEqual(["APEC 3xxx/4xxx/5xxx"]);
    expect(terms("APEC 3xxx-5xxx")).toEqual(["APEC 3xxx/4xxx/5xxx"]);
    expect(terms("GER / SCAN 5xxx-level Course")).toEqual(["GER/SCAN 5xxx"]);
    expect(read("SPAN 5xxx")?.forms).toEqual(["subject-level"]);
  });

  it("reads 4xxx/5xxx EE/CSCI and merges a repeated level list", () => {
    expect(terms(EE_NAME)).toEqual(["EE 4xxx/5xxx"]);
    expect(terms("Additional 4xxx/5xxx EE/CSCI courses")).toEqual(["EE/CSCI 4xxx/5xxx"]);
    expect(terms("Complete additional 4xxx/5xxx EE and/or 4xxx/5xxx CSCI courses to meet the minimum 22 credits.")).toEqual(["EE/CSCI 4xxx/5xxx"]);
    expect(read(EE_NAME)?.forms).toEqual(["level-subject"]);
  });

  it("reads Nxxx or higher SUBJ, in either order", () => {
    const geo =
      "Students must take a minimum of 3 credits of 4xxx or higher electives offered by the Department of Earth Sciences. Any 4xxx or higher ESCI course counts.";
    expect(terms(geo)).toEqual(["ESCI 4xxx or higher"]);
    expect(read(geo)?.forms).toEqual(expect.arrayContaining(["level-subject", "or-higher"]));
    expect(terms("FSCN 3xxx or above")).toEqual(["FSCN 3xxx or higher"]);
  });

  it("reads xxxx Nxxx as any subject", () => {
    expect(terms("Any xxxx 3xxx course")).toEqual(["Any subject 3xxx"]);
    expect(terms("XXXX 4xxx or higher")).toEqual(["Any subject 4xxx or higher"]);
    expect(read("xxxx 3xxx")?.forms).toEqual(["any-subject"]);
  });

  it("reads non-SUBJ, with a level from 'upper division' when the text gives no level", () => {
    expect(terms("Upper-Division Electives: non-ARCH")).toEqual(["Non-ARCH 3xxx or higher"]);
    expect(terms("Electives: non-ARCH")).toEqual(["Non-ARCH (any level)"]);
    expect(terms("non-CSCI 4xxx")).toEqual(["Non-CSCI 4xxx"]);
    expect(read("non-CSCI 4xxx")?.forms).toEqual(["non-subject"]);
  });

  it("reads Excluding/Includes codes, inheriting the subject for bare numbers and continuing a bulleted list", () => {
    const ee = read(`${EE_NAME}\nExcludes EE 4981H. Includes CSCI 4203, 4211 and CSCI 5103.`)!;
    expect(ee.exclude).toEqual(["EE 4981H"]);
    expect(ee.include).toEqual(["CSCI 4203", "CSCI 4211", "CSCI 5103"]);
    expect(ee.forms).toEqual(expect.arrayContaining(["exclude", "include"]));

    const listed = read("EE 4xxx\nExcluding:\n• EE 4951W\n• EE 4952\nStudents work with an advisor.")!;
    expect(listed.exclude).toEqual(["EE 4951W", "EE 4952"]);
    expect(listed.terms.map((t) => describeTerm(t))).toEqual(["EE 4xxx"]);
  });

  it("doesn't read a pattern inside an exclusion as something that counts", () => {
    expect(terms("CSCI 4xxx, except CSCI 5xxx")).toEqual(["CSCI 4xxx"]);
  });

  it("skips cap sentences (documented in heuristics.md)", () => {
    expect(read("Students may not exceed a combined 16 credits total of coursework of EE 5000 level graduate coursework and additional coursework.")).toBeNull();
    expect(read("• Non-EE 4000 and 5000 level coursework--maximum of 12 credits total.\n• EE 4xxx coursework--maximum of 6 credits")).toBeNull();
    expect(terms("No more than 6 credits of PSY 5xxx may count. Take PSY 3xxx.")).toEqual(["PSY 3xxx"]);
  });

  it("reads nothing from a bare level list, plain prose or exclusions alone", () => {
    expect(read("1xxx or 2xxx")).toBeNull();
    expect(read("5xxx-level courses generally include graduate students.")).toBeNull();
    expect(read("Earn at least 12 credits from the following:")).toBeNull();
    expect(read("Excludes EE 4981H.")).toBeNull();
    expect(read(null)).toBeNull();
  });

  it("checks subjects against the catalog's list when given", () => {
    expect(terms("ZZZZ 4xxx", ["EE"])).toBeNull();
    expect(terms("ZZZZ 4xxx")).toEqual(["ZZZZ 4xxx"]);
    expect(terms("GPA 3xxx")).toBeNull(); // capitalized words that aren't subjects
  });

  it("keeps the sentences it read for the hover text", () => {
    expect(read(`${EE_NAME}\nStudents should meet with an advisor.\nExcludes EE 4981H.`)?.sentences).toEqual([EE_NAME, "Excludes EE 4981H."]);
  });
});

describe("matchesPattern / patternMatches (C3)", () => {
  const ee = read(`${EE_NAME}\nExcludes EE 4981H, EE 4951. Includes CSCI 4203.`)!;

  it("matches subject and level", () => {
    expect(matchesPattern(ee, "EE 4111")).toBe(true);
    expect(matchesPattern(ee, "EE 5001")).toBe(true);
    expect(matchesPattern(ee, "ee 4111")).toBe(true);
    expect(matchesPattern(ee, "EE 3015")).toBe(false);
    expect(matchesPattern(ee, "EE 8001")).toBe(false);
    expect(matchesPattern(ee, "CSCI 4041")).toBe(false);
    expect(matchesPattern(ee, null)).toBe(false);
    expect(matchesPattern(ee, "not a code")).toBe(false);
  });

  it("applies exclusions (a base code also excludes its H/V/W versions) and includes", () => {
    expect(matchesPattern(ee, "EE 4981H")).toBe(false);
    expect(matchesPattern(ee, "EE 4981")).toBe(true); // only the honors version is excluded
    expect(matchesPattern(ee, "EE 4951")).toBe(false);
    expect(matchesPattern(ee, "EE 4951W")).toBe(false);
    expect(matchesPattern(ee, "CSCI 4203")).toBe(true);
  });

  it("handles or-higher, any-subject and non-subject terms", () => {
    const geo = read("Any 4xxx or higher ESCI course")!;
    expect(["ESCI 4101", "ESCI 5201", "ESCI 8001", "ESCI 3001"].map((c) => matchesPattern(geo, c))).toEqual([true, true, true, false]);
    const any = read("xxxx 3xxx")!;
    expect(["HIST 3001", "CSCI 3081W", "HIST 4001"].map((c) => matchesPattern(any, c))).toEqual([true, true, false]);
    const arch = read("Upper-Division Electives: non-ARCH")!;
    expect(["HIST 3001", "ARCH 3001", "HIST 1001"].map((c) => matchesPattern(arch, c))).toEqual([true, false, false]);
  });

  it("lists matching planned courses once, with their credits, and skips courses without a code", () => {
    const planned = [
      { courseId: 4693, credits: 4, code: "EE 4111" },
      { courseId: 1266, credits: 2, code: "EE 4981H" },
      { courseId: 4693, credits: 4, code: "EE 4111" },
      { courseId: 686, credits: 3, code: "EE 3015" },
      { courseId: 4763, credits: 4, code: "CSCI 4203" },
      { courseId: 9, credits: 4 },
    ];
    expect(patternMatches(ee, planned)).toEqual([
      { courseId: 4693, code: "EE 4111", credits: 4 },
      { courseId: 4763, code: "CSCI 4203", credits: 4 },
    ]);
  });
});

describe("patternSearches (C3)", () => {
  const term = (text: string) => (readCoursePattern(text) as CoursePattern).terms[0];

  it("gives one search per subject and level, the way the search filters take them", () => {
    expect(patternSearches(term("4xxx/5xxx EE/CSCI"))).toEqual([
      { dept: "EE", level: 4000, label: "EE 4xxx" },
      { dept: "EE", level: 5000, label: "EE 5xxx" },
      { dept: "CSCI", level: 4000, label: "CSCI 4xxx" },
      { dept: "CSCI", level: 5000, label: "CSCI 5xxx" },
    ]);
  });

  it("stops 'or higher' at the search's '5xxx and up'", () => {
    expect(patternSearches(term("ESCI 4xxx or higher")).map((s) => s.label)).toEqual(["ESCI 4xxx", "ESCI 5xxx and up"]);
    expect(patternSearches(term("PUBH 8xxx"))).toEqual([{ dept: "PUBH", level: 5000, label: "PUBH 5xxx and up" }]);
  });

  it("sets only the level for any-subject terms, and nothing for a non-subject term with no level", () => {
    expect(patternSearches(term("xxxx 3xxx"))).toEqual([{ level: 3000, label: "Any 3xxx" }]);
    expect(patternSearches(term("Electives: non-ARCH"))).toEqual([]);
  });
});

// Review of e8065d2 against Hadi's original 9b2c7f0: each case below failed before the fix.
describe("review fixes (C3)", () => {
  const SUBJECTS = ["ACCT", "BLAW", "FINA", "LAW", "SCO", "APEC", "ARCH", "HIST", "CI", "ANTH", "SOC", "EE", "ECON", "MATH", "ENGL"];
  const r = (text: string) => read(text, SUBJECTS);

  it("keeps a non-SUBJ exclusion alongside any-subject terms, without an extra 'upper division' level", () => {
    const p = r("non-ARCH xxxx 3xxx")!;
    expect(p.exceptSubjects).toEqual(["ARCH"]);
    expect(matchesPattern(p, "ARCH 3150")).toBe(false);
    expect(matchesPattern(p, "HIST 3001")).toBe(true);
    const arch = r("Upper-Division Electives: non-ARCH xxxx 3xxx xxxx 4xxx")!;
    expect(terms("Upper-Division Electives: non-ARCH xxxx 3xxx xxxx 4xxx", SUBJECTS)).toEqual(["Non-ARCH 3xxx/4xxx"]);
    expect(["ARCH 3150", "HIST 3001", "HIST 4001", "HIST 5001"].map((c) => matchesPattern(arch, c))).toEqual([false, true, true, false]);
  });

  it("reads 9b2c7f0's real catalog strings", () => {
    expect(terms("ACCT 5XXX BLAW 3XXX FINA 4XXX FINA 5XXX", SUBJECTS)).toEqual(["ACCT 5xxx", "BLAW 3xxx", "FINA 4xxx/5xxx"]);
    expect(terms("APEC 3xxx APEC 4xxx APEC 5xxx", SUBJECTS)).toEqual(["APEC 3xxx/4xxx/5xxx"]);
    expect(terms("ARCH 3XXX ARCH 4XXX", SUBJECTS)).toEqual(["ARCH 3xxx/4xxx"]);
    expect(terms("CI 3xxx-5xxx", SUBJECTS)).toEqual(["CI 3xxx/4xxx/5xxx"]);
    expect(r("1xxx Art Electives")).toBeNull();
    expect(r("Take ENGL 3000 or ENGL 3001.")).toBeNull();
  });

  it("reads exclusion codes in any case, so 'Law 3050' is LAW 3050", () => {
    const p = r("ACCT 5XXX FINA 3XXX Excluding: ACCT 2051, ACCT 2051H, FINA 3001, Law 3050, and SCO 3001")!;
    expect(p.exclude).toEqual(["ACCT 2051", "ACCT 2051H", "FINA 3001", "LAW 3050", "SCO 3001"]);
    expect(matchesPattern(p, "FINA 3050")).toBe(true);
  });

  it("ends an exclusion list at the end of its sentence", () => {
    const p = r("EE 4xxx courses except EE 4981H.\nEE 4111 and EE 4231 are recommended.")!;
    expect(p.exclude).toEqual(["EE 4981H"]);
    expect(matchesPattern(p, "EE 4111")).toBe(true);
  });

  it("keeps the last item of a list ending in ', or' / ', and'", () => {
    expect(terms("Any 3xxx or 4xxx ANTH, SOC, or HIST course", SUBJECTS)).toEqual(["ANTH/SOC/HIST 3xxx/4xxx"]);
    expect(terms("EE 4xxx, 5xxx, and 8xxx", SUBJECTS)).toEqual(["EE 4xxx/5xxx/8xxx"]);
  });

  it("drops a parenthetical cap without splitting at 'max.', and gives each search link once", () => {
    const p = r("4xxx/5xxx EE courses (max. of 8 credits of EE 5xxx).")!;
    expect(p.terms.map((t) => describeTerm(t))).toEqual(["EE 4xxx/5xxx"]);
    expect(patternSearchLinks(p).map((s) => s.label)).toEqual(["EE 4xxx", "EE 5xxx"]);
    const twice = { ...p, terms: [...p.terms, { subjects: ["EE"], levels: [5] }] };
    expect(patternSearchLinks(twice).map((s) => s.label)).toEqual(["EE 4xxx", "EE 5xxx"]);
  });

  it("reads no pattern from a negated sentence", () => {
    expect(r("No ECON 3xxx courses may be used.")).toBeNull();
    expect(r("MATH 1xxx and 2xxx excluded")).toBeNull();
    expect(terms("HIST 3xxx. No ECON 3xxx courses may be used.", SUBJECTS)).toEqual(["HIST 3xxx"]);
  });
});
