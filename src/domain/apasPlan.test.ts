import { describe, expect, it } from "vitest";
import type { ApasAudit, ApasCourse } from "./apas";
import { apasPlan, apasProgramId } from "./apasPlan";

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
});
