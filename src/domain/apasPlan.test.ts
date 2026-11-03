import { describe, expect, it } from "vitest";
import type { ApasAudit, ApasCourse } from "./apas";
import { apasPlan, apasPlanFromAudits, apasPreparedTime, apasProgramId, mergeApasCourses } from "./apasPlan";

const course = (
  code: string,
  termRaw: string,
  term: string | null,
  kind: ApasCourse["kind"],
  over: Partial<ApasCourse> = {},
): ApasCourse => ({
  code,
  termRaw,
  term,
  campus: "1",
  credits: 4,
  grade: "A",
  condition: "",
  kind,
  earnedCredit: kind === "completed" || kind === "exam" || kind === "transfer",
  title: code,
  notes: [],
  ...over,
});

const audit: ApasAudit = {
  program: { code: "1019600271", title: "Computer Science BSCompSc" },
  catalogTerm: "1249",
  preparedOn: null,
  expectedGradTerm: "1283",
  complete: false,
  requirements: [],
  courses: [
    course("CSCI 1001", "SP21", "1213", "exam", { grade: "T4" }),
    course("CHEM 1061", "SP24", "1243", "transfer", { grade: "T" }),
    course("CHEM 1062", "F 25", "1259", "transfer", { grade: "T" }),
    course("MATH 1271", "F 24", "1249", "completed"),
    course("MATH 1272", "SP25", "1253", "completed", {
      grade: "F",
      earnedCredit: false,
    }),
    course("MATH 1272", "F 25", "1259", "completed"),
    course("EE 3101", "F 25", "1259", "withdrawn", { grade: "W", credits: 0 }),
    course("POL 1001", "SP22", "1223", "no-credit", {
      grade: "N2",
      credits: 0,
    }),
    course("EE 5373", "F 26", "1269", "in-progress", {
      grade: "AF",
      condition: "IP",
      credits: 1,
      title: "Brand New Course",
    }),
  ],
};
const ids = new Map([
  ["CSCI 1001", 10],
  ["CHEM 1061", 11],
  ["CHEM 1062", 12],
  ["MATH 1271", 13],
  ["MATH 1272", 14],
]);
const programs = [
  "019627107",
  "026421707",
  "0555MIN07",
  "0555MING07",
  "0160MING07",
];
const now = new Date(2026, 9, 27);

describe("apasProgramId", () => {
  it("maps majors by plan + degree digits, sub-plans included", () => {
    expect(apasProgramId("1019600271", programs)).toBe("019627107");
    expect(apasProgramId("1026400217", programs)).toBe("026421707");
    expect(apasProgramId("1026403217", programs)).toBe("026421707");
  });
  it("maps minors only when unique", () => {
    expect(apasProgramId("2016000000", programs)).toBe("0160MING07");
    expect(apasProgramId("2055500000", programs)).toBeNull();
  });
  it("maps pseudo-programs to nothing", () => {
    expect(apasProgramId("1050307000", programs)).toBeNull(); // lower division
    expect(apasProgramId("1230100000", programs)).toBeNull(); // honors
    expect(apasProgramId("LECHECK", programs)).toBeNull();
  });
});

describe("apasPlan", () => {
  const r = apasPlan(audit, ids, programs, now);
  const sem = (index: string) =>
    r.plan.semesters.find((s) => s.index === index && s.kind !== "prior")!;
  const prior = r.plan.semesters.find((s) => s.kind === "prior")!;

  it("spans the first UMN term through expected graduation, with prior credit first", () => {
    const regular = r.plan.semesters
      .filter((s) => s.kind !== "prior")
      .map((s) => s.index);
    expect(regular[0]).toBe("1249");
    expect(regular.at(-1)).toBe("1283");
    expect(r.plan.semesters[0]).toBe(prior);
    expect(r.plan.programs).toEqual(["019627107"]);
    expect(r.program).toEqual({
      apasCode: "1019600271",
      title: "Computer Science BSCompSc",
      programId: "019627107",
    });
  });

  it("puts exam credit, and transfer credit from before the first UMN term, in prior credit", () => {
    expect(prior.courses.map((c) => c.id).sort()).toEqual([10, 11]);
    expect(sem("1259").courses.map((c) => c.id)).toContain(12);
  });

  it("locks every placed course in its term, and skips withdrawn, no-credit and failed rows", () => {
    expect(sem("1249").courses).toEqual([{ id: 13, lock: "locked" }]);
    expect(sem("1259").courses).toContainEqual({ id: 14, lock: "locked" });
    expect(sem("1253").courses).toEqual([]);
    expect(r.skipped.map((s) => [s.code, s.reason])).toEqual([
      ["MATH 1272", "failed"],
      ["EE 3101", "withdrawn"],
      ["POL 1001", "no-credit"],
    ]);
    expect(r.matched).toBe(5);
  });

  it("keeps courses missing from the catalog as placeholder slots with APAS credits", () => {
    expect(sem("1269").placeholders).toEqual([
      { key: "apas-ee-5373", label: "EE 5373 · Brand New Course", credits: 1 },
    ]);
    expect(r.placeholders).toEqual([{ code: "EE 5373", term: "1269" }]);
  });

  it("has no program when the code doesn't map", () => {
    const honors = apasPlan(
      {
        ...audit,
        program: { code: "1230100000", title: "University Honors Program" },
      },
      ids,
      programs,
      now,
    );
    expect(honors.plan.programs).toEqual([]);
    expect(honors.program.programId).toBeNull();
  });

  it("reports placeholders only once inserted; cap overflow and duplicates are listed (review fix, #71)", () => {
    const many = Array.from({ length: 21 }, (_, i) => course(`NEW ${1000 + i}`, "F 26", "1269", "in-progress", { credits: 1 }));
    const twice = course("MATH 1271", "F 24", "1249", "completed");
    const capped = apasPlan({ ...audit, courses: [...audit.courses, ...many, twice] }, ids, programs, now);
    expect(capped.plan.semesters.find((s) => s.index === "1269" && s.kind !== "prior")!.placeholders).toHaveLength(20);
    expect(capped.placeholders.filter((p) => p.term === "1269")).toHaveLength(20);
    expect(capped.skipped.filter((s) => s.reason === "slot-limit").map((s) => s.code)).toEqual(["NEW 1019", "NEW 1020"]);
    expect(capped.skipped.filter((s) => s.reason === "duplicate").map((s) => s.code)).toEqual(["MATH 1271"]);
    expect(capped.matched).toBe(5);
  });
});

// B1 multi-audit: a major and a minor for the same (synthetic) student. APAS shows one program per
// report, so the minor's report repeats some of the major's course rows.
describe("several reports into one plan (B1 multi-audit)", () => {
  const major: ApasAudit = { ...audit, preparedOn: "10/27/2026 02:02 PM" };
  const minor: ApasAudit = {
    program: { code: "2000400000", title: "Accounting Minor" },
    catalogTerm: "1249",
    preparedOn: "10/28/2026 09:15 AM",
    expectedGradTerm: "1283",
    complete: false,
    requirements: [],
    courses: [
      course("CSCI 1001", "SP21", "1213", "exam", { grade: "T4" }), // shared
      course("MATH 1271", "F 24", "1249", "completed"), // shared
      course("MATH 1272", "SP25", "1253", "completed", { grade: "F", earnedCredit: false }), // shared failed attempt
      course("MATH 1272", "F 25", "1259", "completed"), // shared retake
      course("ACCT 2051", "SP25", "1253", "completed"), // minor only
      course("ACCT 5100", "F 26", "1269", "in-progress", { grade: "AF", condition: "IP", credits: 3, title: "Brand New Acct" }), // minor only, not in catalog
    ],
  };
  const both = [...programs, "0004MIN02"];
  const minorIds = new Map([...ids, ["ACCT 2051", 15]]);
  const r = apasPlanFromAudits([major, minor], minorIds, both, now);
  const placed = r.plan.semesters.flatMap((s) => s.courses.map((c) => c.id));
  const sem = (index: string) => r.plan.semesters.find((s) => s.index === index && s.kind !== "prior")!;

  it("adds every report's program, in import order", () => {
    expect(r.plan.programs).toEqual(["019627107", "0004MIN02"]);
    expect(r.programs.map((p) => p.programId)).toEqual(["019627107", "0004MIN02"]);
    expect(r.program.programId).toBe("019627107");
  });

  it("places a course the reports share once, and keeps retakes as a single report does", () => {
    expect(r.shared).toBe(4);
    for (const id of [10, 13]) expect(placed.filter((x) => x === id)).toHaveLength(1);
    // MATH 1272: the failed SP25 attempt is still left out, the F25 retake still placed, each once.
    expect(placed.filter((x) => x === 14)).toHaveLength(1);
    expect(sem("1259").courses).toContainEqual({ id: 14, lock: "locked" });
    expect(r.skipped.filter((s) => s.code === "MATH 1272")).toEqual([{ code: "MATH 1272", termRaw: "SP25", reason: "failed" }]);
    expect(r.skipped.some((s) => s.reason === "duplicate")).toBe(false);
  });

  it("merges the minor's own rows, placeholders included, into the same plan", () => {
    expect(sem("1253").courses).toEqual([{ id: 15, lock: "locked" }]);
    expect(sem("1269").placeholders?.map((p) => p.key).sort()).toEqual(["apas-acct-5100", "apas-ee-5373"]);
    expect(r.matched).toBe(6);
    // Prior credit as for one report: exam credit and early transfer credit.
    expect(r.plan.semesters.find((s) => s.kind === "prior")!.courses.map((c) => c.id).sort()).toEqual([10, 11]);
  });

  it("places the same courses whichever report was imported first; programs follow import order", () => {
    const flipped = apasPlanFromAudits([minor, major], minorIds, both, now);
    expect(flipped.plan.programs).toEqual(["0004MIN02", "019627107"]);
    const contents = (p: typeof r) =>
      p.plan.semesters.map((s) => [s.index, s.kind, s.courses.map((c) => c.id).sort(), (s.placeholders ?? []).map((x) => x.key).sort()]);
    expect(contents(flipped)).toEqual(contents(r));
    expect(flipped.shared).toBe(4);
  });

  it("runs through the latest expected graduation term", () => {
    const late = apasPlanFromAudits([major, { ...minor, expectedGradTerm: "1289" }], minorIds, both, now);
    expect(late.plan.semesters.at(-1)!.index).toBe("1289");
  });

  it("is exactly apasPlan for a single report", () => {
    expect(apasPlanFromAudits([audit], ids, programs, now)).toEqual(apasPlan(audit, ids, programs, now));
    expect(apasPlan(audit, ids, programs, now)).toMatchObject({ shared: 0, programs: [{ programId: "019627107" }] });
  });
});

describe("mergeApasCourses (B1 multi-audit dedupe)", () => {
  const older: ApasAudit = {
    ...audit,
    preparedOn: "09/02/2026 08:00 AM",
    courses: [course("MATH 1271", "F 26", "1269", "in-progress", { grade: "AF", condition: "IP" })],
  };
  const newer: ApasAudit = { ...audit, preparedOn: "12/20/2026 04:30 PM", courses: [course("MATH 1271", "F 26", "1269", "completed", { grade: "B" })] };

  it("keeps the most recently prepared report's row for a shared course and term", () => {
    for (const order of [
      [older, newer],
      [newer, older],
    ]) {
      const m = mergeApasCourses(order);
      expect(m.courses.map((c) => [c.code, c.kind, c.grade])).toEqual([["MATH 1271", "completed", "B"]]);
      expect(m.shared).toBe(1);
    }
  });

  it("falls back to import order when a report has no date", () => {
    const m = mergeApasCourses([{ ...older, preparedOn: null }, { ...newer, preparedOn: null }]);
    expect(m.courses.map((c) => c.kind)).toEqual(["in-progress"]);
  });

  it("keeps a retake in another term, and a report's own repeated rows", () => {
    const retake = course("MATH 1271", "SP27", "1273", "completed");
    const sameTermTwice = [course("EE 3101", "F 25", "1259", "withdrawn", { grade: "W" }), course("EE 3101", "F 25", "1259", "completed")];
    const m = mergeApasCourses([
      { ...older, courses: [...older.courses, ...sameTermTwice] },
      { ...newer, preparedOn: null, courses: [retake, ...sameTermTwice] },
    ]);
    expect(m.courses.map((c) => `${c.code} ${c.termRaw} ${c.kind}`)).toEqual([
      "MATH 1271 F 26 in-progress",
      "EE 3101 F 25 withdrawn",
      "EE 3101 F 25 completed",
      "MATH 1271 SP27 completed",
    ]);
    expect(m.shared).toBe(2);
  });

  it("reads APAS's Prepared On date", () => {
    expect(apasPreparedTime("10/27/2026 02:02 PM")).toBe(Date.UTC(2026, 9, 27, 14, 2));
    expect(apasPreparedTime("10/27/2026 12:05 AM")).toBe(Date.UTC(2026, 9, 27, 0, 5));
    expect(apasPreparedTime("10/27/2026")).toBe(Date.UTC(2026, 9, 27));
    expect(apasPreparedTime(null)).toBeNull();
    expect(apasPreparedTime("yesterday")).toBeNull();
  });
});
