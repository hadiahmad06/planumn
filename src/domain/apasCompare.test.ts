// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseApasHtml } from "@/features/apas/parseReport";
import {
  apasPairIndex,
  compareApas,
  compareApasProgram,
  describeApasStatus,
  nameMatch,
  nameWords,
  plannedOnRecord,
} from "./apasCompare";
import { evaluateProgram, type CoursesRule, type PlannedForAudit, type Program, type Requirement, type Rule } from "./requirements";

// Fake data in the real uAchieve 5.2 markup (synthetic fixture; never a real report).
const html = readFileSync(path.resolve(__dirname, "../features/apas/__fixtures__/apas-audit-fake.html"), "utf8");
const audit = parseApasHtml(html)!;

const courses = (id: string, name: string, ids: number[], minCourses = ids.length): CoursesRule => ({
  kind: "courses",
  id,
  name,
  notes: null,
  choices: ids.map((i) => ({ options: [{ groupId: String(i), courseId: i, code: null, title: null, credits: null }] })),
  minCourses,
  minCredits: 0,
});
const req = (id: string, name: string, rules: Rule[]): Requirement => ({ id, name, notes: null, rules });

// Catalog ids: 1 MATH 1271, 2 EE 2115, 3 CSCI 1001, 4 PHYS 1401, 5 PHYS 1401V, 6 CSCI 4011, 7 EE 3101.
const program: Program = {
  id: "EXSCI",
  name: "Example Science B.S.",
  type: "Major",
  requirements: [
    req("math", "Mathematics and Circuits Requirements", [courses("math-r", "Calculus and circuits", [1, 2])]),
    req("telec", "Technical Electives (up to 22 credits)", [courses("telec-r", "Approved electives", [3, 6], 1)]),
    req("core", "Science Core", [courses("wi", "Upper Division Writing Intensive", [4], 1)]),
    req("themes", "Designated Themes", [{ kind: "text", id: "themes-t", name: "Lib Ed themes", notes: null, text: "See APAS." }]),
    req("senior", "Senior Project", [courses("senior-r", "Senior Project", [7])]),
  ],
};

const planned: PlannedForAudit[] = [
  { courseId: 1, credits: 4, code: "MATH 1271" }, // completed
  { courseId: 2, credits: 4, code: "EE 2115" }, // in progress
  { courseId: 3, credits: 3, code: "CSCI 1001" }, // AP exam credit
  { courseId: 5, credits: 4, code: "PHYS 1401V" }, // honors section: the catalog's list only names PHYS 1401
  { courseId: 7, credits: 4, code: "EE 3101" }, // withdrawn on the audit, planned again later
  { courseId: 6, credits: 3, code: "CSCI 4011" }, // a future course APAS hasn't seen
];

describe("requirement names (C4 matching rule)", () => {
  it("normalizes case, '&', parentheticals, filler words and plurals", () => {
    expect(nameWords("Mathematics & Circuits")).toEqual(nameWords("Mathematics and Circuits Requirements"));
    expect(nameWords("Technical Electives (up to 22 credits)")).toEqual(["elective", "technical"]);
    expect(nameWords("Core Courses")).toEqual(["core"]);
  });

  it("calls names exact, similar or unrelated", () => {
    expect(nameMatch("Writing Intensive", "writing-intensive")).toBe(1);
    const similar = nameMatch("Writing Intensive", "Upper Division Writing Intensive");
    expect(similar).toBeGreaterThan(0);
    expect(similar).toBeLessThan(1);
    // One shared word isn't enough on its own.
    expect(nameMatch("Mathematics", "Mathematics Electives")).toBe(0);
    expect(nameMatch("Senior Project", "Technical Electives")).toBe(0);
    expect(nameMatch("Requirements", "Courses")).toBe(0);
  });
});

describe("courses on the audit's record", () => {
  it("keeps earned, exam, transfer, in-progress and registered courses; drops withdrawn, no-credit and unknown codes", () => {
    const kept = plannedOnRecord(
      [...planned, { courseId: 8, credits: 4, code: "CHEM 1062" }, { courseId: 9, credits: 3, code: "POL 1001" }, { courseId: 10, credits: 3, code: null }],
      audit,
    );
    expect(kept.map((p) => p.code)).toEqual(["MATH 1271", "EE 2115", "CSCI 1001", "PHYS 1401V", "CHEM 1062"]);
  });
});

describe("compareApasProgram (C4)", () => {
  const c = compareApasProgram(audit, program, planned);
  const pair = (apasId: string) => c.pairs.find((p) => p.apas.id === apasId);

  it("agrees when APAS is complete with courses in progress and planu.mn counts the requirement met", () => {
    expect(pair("MATHSCI")).toMatchObject({
      match: "exact",
      verdict: "agree",
      target: { level: "requirement", id: "math", satisfied: true, units: 1, filled: 1 },
    });
  });

  it("flags planu.mn counting a requirement APAS says isn't complete", () => {
    expect(pair("CSCITELEC")).toMatchObject({ match: "exact", verdict: "disagree", target: { id: "telec", satisfied: true } });
  });

  it("flags APAS counting what planu.mn doesn't, paired to a rule by a similar name", () => {
    expect(pair("WI REQ")).toMatchObject({
      match: "similar",
      verdict: "disagree",
      target: { level: "rule", requirementId: "core", id: "wi", satisfied: false },
    });
  });

  it("calls a requirement planu.mn counts nothing for 'unchecked', not a disagreement", () => {
    expect(pair("THEMES")).toMatchObject({ verdict: "unchecked", target: { id: "themes", units: 0 } });
  });

  it("keeps unmatched requirements on both sides, and leaves headings out", () => {
    expect(c.apasOnly.map((r) => r.title)).toEqual(["Minimum Degree Credits"]);
    expect(c.planumnOnly).toEqual([{ id: "senior", name: "Senior Project" }]);
    expect(c.ignored.map((r) => r.id)).toEqual(["COMSCTEXT", "OTHERS"]);
    expect(c.disagreements).toBe(2);
  });

  it("uses only the courses APAS has on record, never the rest of the plan", () => {
    // The full plan meets Senior Project (EE 3101 retaken); the audit's record doesn't, and APAS isn't asked.
    expect(evaluateProgram(program, planned).requirements.find((r) => r.requirement.id === "senior")?.satisfied).toBe(true);
    const withSenior = compareApasProgram(
      { ...audit, requirements: [...audit.requirements, { ...audit.requirements.find((r) => r.id === "WI REQ")!, id: "SENIOR", title: "Senior Project" }] },
      program,
      planned,
    );
    expect(withSenior.pairs.find((p) => p.apas.id === "SENIOR")).toMatchObject({ verdict: "disagree", target: { id: "senior", satisfied: false } });
  });

  it("indexes pairs for the rail by requirement id, and rule pairs by requirement then rule id", () => {
    const index = apasPairIndex(c);
    expect(index.requirements.get("math")?.apas.id).toBe("MATHSCI");
    expect(index.rules.get("core")?.get("wi")?.apas.id).toBe("WI REQ");
    expect(index.rules.has("math")).toBe(false);
  });
});

describe("pairing order", () => {
  it("prefers a requirement over its own rule of the same name, and pairs one to one", () => {
    const one: Program = { ...program, requirements: [req("wi-req", "Writing Intensive", [courses("wi-rule", "Writing Intensive", [5])])] };
    const c = compareApas(audit, evaluateProgram(one, planned));
    expect(c.pairs.filter((p) => p.target.requirementId === "wi-req")).toEqual([
      expect.objectContaining({ apas: expect.objectContaining({ id: "WI REQ" }), target: expect.objectContaining({ level: "requirement" }), verdict: "agree" }),
    ]);
  });

  it("prefers an exact name over a similar one", () => {
    const two: Program = {
      ...program,
      requirements: [req("udwi", "Upper Division Writing Intensive", [courses("a", "A", [5])]), req("wi", "Writing Intensive", [courses("b", "B", [4])])],
    };
    expect(compareApas(audit, evaluateProgram(two, planned)).pairs.find((p) => p.apas.id === "WI REQ")?.target.id).toBe("wi");
  });
});

describe("describeApasStatus", () => {
  const r = (id: string) => audit.requirements.find((x) => x.id === id)!;
  it("says what APAS says, with what's still needed where the report has it", () => {
    expect(describeApasStatus(r("WI REQ"))).toBe("complete");
    expect(describeApasStatus(r("MATHSCI"))).toBe("complete with courses in progress");
    expect(describeApasStatus(r("CSCITELEC"))).toBe("not complete, needs 10 credits, 2 sub-requirements");
    // No totals on the requirement: the open sub-requirement's needs.
    expect(describeApasStatus(r("THEMES"))).toBe("not complete, needs 1 group");
  });
});
