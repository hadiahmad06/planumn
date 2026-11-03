// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { ApasAudit, ApasRequirement } from "@/domain/apas";
import { evaluateProgram, type CoursesRule, type PlannedForAudit, type Program } from "@/domain/requirements";
import { importedAuditKey } from "@/features/apas/importedAudit";
import { apasComparisons } from "./useApasComparison";

// Synthetic audits and programs (B1 multi-audit, C4 per program); never a real report.
const requirement = (id: string, title: string, status: ApasRequirement["status"]): ApasRequirement => ({
  id,
  title,
  status,
  earned: { credits: null, courses: null },
  inProgress: { credits: null, courses: null },
  needs: null,
  subrequirements: [],
});
const audit = (code: string, title: string, requirements: ApasRequirement[]): ApasAudit => ({
  program: { code, title },
  catalogTerm: "1249",
  preparedOn: "10/27/2026 02:02 PM",
  expectedGradTerm: "1283",
  complete: false,
  requirements,
  courses: [
    { term: "1249", termRaw: "F 24", code: "MATH 1271", campus: "1", credits: 4, grade: "A", condition: "", kind: "completed", earnedCredit: true, title: "", notes: [] },
    { term: "1253", termRaw: "SP25", code: "ACCT 2051", campus: "1", credits: 4, grade: "A", condition: "", kind: "completed", earnedCredit: true, title: "", notes: [] },
  ],
});
const rule = (id: string, ids: number[]): CoursesRule => ({
  kind: "courses",
  id,
  name: id,
  notes: null,
  choices: ids.map((i) => ({ options: [{ groupId: String(i), courseId: i, code: null, title: null, credits: null }] })),
  minCourses: ids.length,
  minCredits: 0,
});
const program = (id: string, name: string, reqs: [string, string, number[]][]): Program => ({
  id,
  name,
  type: "Major",
  requirements: reqs.map(([rid, rname, ids]) => ({ id: rid, name: rname, notes: null, rules: [rule(`${rid}-r`, ids)] })),
});

const cs = program("019627107", "Computer Science B.S.", [["calc", "Calculus", [1]]]);
const acct = program("0004MIN02", "Accounting Minor", [
  ["core", "Accounting Core", [2]],
  ["calc", "Calculus", [1]],
]);
const other = program("026421707", "Another Major", [["calc", "Calculus", [1]]]);
const planned: PlannedForAudit[] = [
  { courseId: 1, credits: 4, code: "MATH 1271" },
  { courseId: 2, credits: 4, code: "ACCT 2051" },
];
const results = [cs, acct, other].map((p) => evaluateProgram(p, planned));

// The major's audit says Calculus isn't complete; the minor's says it is. Each program must use its own.
const majorAudit = audit("1019600271", "Computer Science BSCompSc", [requirement("CALC", "Calculus", "incomplete")]);
const minorAudit = audit("2000400000", "Accounting Minor", [
  requirement("ACCTCORE", "Accounting Core", "complete"),
  requirement("CALC", "Calculus", "complete"),
]);
const held = [majorAudit, minorAudit].map((a) => importedAuditKey(a));

describe("APAS says, per program (C4 with several audits)", () => {
  const c = apasComparisons(held, results, planned);

  it("compares each of the plan's programs with that program's own audit", () => {
    expect([...c.keys()]).toEqual(["019627107", "0004MIN02"]);
    expect(c.get("019627107")!.audit).toBe(majorAudit);
    expect(c.get("0004MIN02")!.audit).toBe(minorAudit);
  });

  it("counts disagreements per program from its own audit", () => {
    const major = c.get("019627107")!.comparison;
    expect(major.pairs.map((p) => [p.apas.title, p.verdict])).toEqual([["Calculus", "disagree"]]);
    expect(major.disagreements).toBe(1);
    const minor = c.get("0004MIN02")!.comparison;
    expect(minor.pairs.map((p) => [p.apas.title, p.verdict]).sort()).toEqual([
      ["Accounting Core", "agree"],
      ["Calculus", "agree"],
    ]);
    expect(minor.disagreements).toBe(0);
  });

  it("leaves a program without an audit out, and shows nothing with no audits", () => {
    expect(c.has("026421707")).toBe(false);
    expect(apasComparisons([], results, planned).size).toBe(0);
  });

  it("never pairs a report whose program maps to nothing", () => {
    const unmapped = importedAuditKey(audit("1230100000", "University Honors Program", [requirement("CALC", "Calculus", "complete")]));
    expect(apasComparisons([unmapped], results, planned).size).toBe(0);
  });
});
