// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseApasHtml } from "./parseReport";

// Fake data in the real uAchieve 5.2 markup (see the comment at the top of the fixture).
const html = readFileSync(path.resolve(__dirname, "__fixtures__/apas-audit-fake.html"), "utf8");
const audit = parseApasHtml(html)!;
const course = (code: string) => audit.courses.find((c) => c.code === code)!;
const req = (id: string) => audit.requirements.find((r) => r.id === id)!;

describe("parseApasReport (B1 step 2)", () => {
  it("reads the header: program, catalog year, expected graduation, completion", () => {
    expect(audit.program).toEqual({ code: "0000000271", title: "Example Science BSExSci" });
    expect(audit).toMatchObject({ catalogTerm: "1249", expectedGradTerm: "1283", preparedOn: "10/27/2026 02:02 PM", complete: false });
  });

  it("never keeps the student ID or advisor names", () => {
    const json = JSON.stringify(audit);
    expect(json).not.toContain("0000000\"");
    expect(json).not.toContain("Example Advisor");
  });

  it("reads one copy of the audit, and each course once", () => {
    expect(audit.requirements).toHaveLength(6);
    expect(audit.courses.map((c) => c.code).sort()).toEqual(
      ["CHEM 1062", "CSCI 1001", "EE 2115", "EE 3101", "MATH 1271", "NOTR 0T001", "PHYS 1401V", "POL 1001"].sort(),
    );
  });

  it("classifies course rows", () => {
    expect(course("CSCI 1001")).toMatchObject({ term: "1213", kind: "exam", earnedCredit: true, grade: "T4", title: "COMPUTER SCIENCE PRINCIPLES", notes: ["AP EXAM: CSCIP"] });
    expect(course("CHEM 1062")).toMatchObject({ term: "1229", kind: "transfer", earnedCredit: true });
    expect(course("MATH 1271")).toMatchObject({ kind: "completed", earnedCredit: true, credits: 4 });
    expect(course("EE 2115")).toMatchObject({ term: "1269", kind: "in-progress", earnedCredit: false, condition: "IP", campus: "1" });
    expect(course("EE 3101")).toMatchObject({ kind: "withdrawn", earnedCredit: false });
    expect(course("POL 1001")).toMatchObject({ kind: "no-credit", earnedCredit: false });
  });

  it("trusts APAS's 'do not earn credit' list over grade rules (NOTR placeholder)", () => {
    expect(course("NOTR 0T001")).toMatchObject({ grade: "T3", kind: "no-credit", earnedCredit: false });
  });

  it("reads requirement status, totals and needs", () => {
    expect(req("124 CRS")).toMatchObject({ title: "Minimum Degree Credits", status: "in-progress", earned: { credits: 16 }, inProgress: { credits: 4 } });
    expect(req("CSCITELEC").needs).toEqual({ credits: 10, courses: null, groups: null, subrequirements: 2 });
    expect(req("COMSCTEXT")).toMatchObject({ title: "Example Science BSExSci - Major Requirements", status: "none", subrequirements: [] });
    expect(req("THEMES").subrequirements[0]).toMatchObject({ title: "The Environment", status: "incomplete", needs: { groups: 1, courses: null } });
  });

  it("reads sub-requirements: titles, R marker, courses used, select-from options", () => {
    const [note, math] = req("CSCITELEC").subrequirements;
    expect(note).toMatchObject({ title: "Talk with an advisor about tracks.", status: "none", required: false });
    expect(math).toMatchObject({ status: "incomplete", required: true, needs: { courses: 1 } });
    expect(math.options).toEqual(["CSCI 4011", "CSCI 4***", "EE 4161"]);
    expect(req("WI REQ").subrequirements[0].courses).toEqual(["PHYS 1401V"]);
  });

  it("returns null for pages that aren't an audit", () => {
    expect(parseApasHtml("<html><body><h1>Request an APAS</h1><button id='runAudit'>Run Declared Programs</button></body></html>")).toBeNull();
  });
});
