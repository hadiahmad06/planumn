import { describe, expect, it } from "vitest";
import { checkPrereqs, extractPrereqText, parsePrereqs } from "./prereqs";

const has = (...codes: string[]) => (code: string) => codes.includes(code);

describe("extractPrereqText", () => {
  it("finds the prereq clause", () => {
    expect(extractPrereqText("Recursion, higher-order functions. prereq: (CSci 1913 or CSci 1933) and CSci 2011")).toBe("(CSci 1913 or CSci 1933) and CSci 2011");
    expect(extractPrereqText("No prerequisites listed here")).toBeNull();
    expect(extractPrereqText(null)).toBeNull();
  });
});

describe("parsePrereqs (real catalog text)", () => {
  it("CSCI 2041: (CSci 1913 or CSci 1933) and CSci 2011", () => {
    expect(parsePrereqs("(CSci 1913 or CSci 1933) and CSci 2011", "CSCI")).toEqual({
      kind: "and",
      children: [
        { kind: "or", children: [{ kind: "course", code: "CSCI 1913" }, { kind: "course", code: "CSCI 1933" }] },
        { kind: "course", code: "CSCI 2011" },
      ],
    });
  });

  it("CSCI 4061: bare numbers inherit the course's department; ';' separates and-clauses", () => {
    const node = parsePrereqs("2021 or EE 2361; CS upper div, CompE upper div., EE upper div., EE grad, ITI upper div., or dept. permission; no cr for grads in CSci.", "CSCI")!;
    expect(node.kind).toBe("and");
    expect(checkPrereqs(node, has("CSCI 2021")).met).toBe(true);
    expect(checkPrereqs(node, has("EE 2361")).met).toBe(true);
    expect(checkPrereqs(node, has()).met).toBe(false);
  });

  it("returns null when no course is mentioned", () => {
    expect(parsePrereqs("CS upper div, CS grad, or dept. permission", "CSCI")).toBeNull();
  });

  it("handles slash lists", () => {
    const node = parsePrereqs("MATH 1271/1371", "MATH")!;
    expect(checkPrereqs(node, has("MATH 1371")).met).toBe(true);
  });
});

describe("checkPrereqs", () => {
  it("explains what's missing", () => {
    const node = parsePrereqs("(CSci 1913 or CSci 1933) and CSci 2011", "CSCI")!;
    expect(checkPrereqs(node, has("CSCI 2011"))).toEqual({ met: false, missing: "CSCI 1913 or CSCI 1933", hasOtherPaths: false });
    expect(checkPrereqs(node, has("CSCI 1933"))).toMatchObject({ met: false, missing: "CSCI 2011" });
    expect(checkPrereqs(node, has("CSCI 1933", "CSCI 2011")).met).toBe(true);
  });

  it("notes when consent or standing is another way in (CSCI 4041)", () => {
    const node = parsePrereqs("[(CSCI 1913 or CSCI 1933) and CSCI 2011] or instr consent or grad standing", "CSCI")!;
    expect(checkPrereqs(node, has())).toEqual({ met: false, missing: "(CSCI 1913 or CSCI 1933) and CSCI 2011", hasOtherPaths: true });
  });
});

describe("department before a bracketed list (B24 finding)", () => {
  it("reads MATH [1271 OR 1371] as MATH courses", () => {
    expect(parsePrereqs("CSCI [1103 OR 1113 OR 1133] & MATH [1271 OR 1371 OR 1571H]", "CSCI")).toEqual({
      kind: "and",
      children: [
        { kind: "or", children: ["CSCI 1103", "CSCI 1113", "CSCI 1133"].map((code) => ({ kind: "course", code })) },
        { kind: "or", children: ["MATH 1271", "MATH 1371", "MATH 1571H"].map((code) => ({ kind: "course", code })) },
      ],
    });
  });
});

// Backlog after #86 (B22): a grade minimum swallowed the course after it into an "other" node.
describe("grade minimums before a course", () => {
  const c = (code: string) => ({ kind: "course", code });

  it("reads the course after 'grade of at least C- in', also with the label left on", () => {
    const want = { kind: "or", children: [c("CSCI 1133"), c("CSCI 1103")] };
    expect(parsePrereqs("grade of at least C- in CSCI 1133 or CSCI 1103", "CSCI")).toEqual(want);
    expect(parsePrereqs("Prereq: grade of at least C- in CSCI 1133 or CSCI 1103", "CSCI")).toEqual(want);
    // CHEM 2302: a bare number after the grade takes the course's department.
    expect(parsePrereqs("Grade of at least C- in 2301", "CHEM")).toEqual(c("CHEM 2301"));
  });

  it("doesn't split 'C- or better' into an alternative (SPAN 3401, GEOG 5563)", () => {
    expect(parsePrereqs("C- or better in SPAN 3015W or SPAN 3015V or SPAN 3019W", "SPAN")).toEqual({
      kind: "or",
      children: [c("SPAN 3015W"), c("SPAN 3015V"), c("SPAN 3019W")],
    });
    const geog = parsePrereqs("B or better in 3561 or 5561 or instr consent", "GEOG")!;
    expect(checkPrereqs(geog, has())).toEqual({ met: false, missing: "GEOG 3561 or GEOG 5561", hasOtherPaths: true });
  });

  it("keeps placement text as another way in, not a course (SPAN 1004)", () => {
    const node = parsePrereqs("A Grade of C- or better in SPAN 1003 or EPT placement of SPAN 1004", "SPAN")!;
    expect(node).toEqual({ kind: "or", children: [c("SPAN 1003"), { kind: "other", text: "EPT placement of SPAN 1004" }] });
  });
});

// Backlog after #86 (B22): what a comma means, checked against data/catalog.db's own strings.
describe("commas: lists and clauses", () => {
  it("reads 'A or B, C' as (A or B) and C (ME 3332, JOUR 3251, FINA 4329)", () => {
    const me = parsePrereqs("Math 2243 or Math 2373, ME 3331", "ME")!;
    expect(checkPrereqs(me, has("MATH 2243")).met).toBe(false);
    expect(checkPrereqs(me, has("MATH 2243", "ME 3331")).met).toBe(true);
    expect(checkPrereqs(me, has("MATH 2373", "ME 3331")).met).toBe(true);
    const jour = parsePrereqs("JOUR 3004 or 3004H, JOUR 3201, Strat Comm major", "JOUR")!;
    expect(checkPrereqs(jour, has("JOUR 3004")).met).toBe(false);
    expect(checkPrereqs(jour, has("JOUR 3004H", "JOUR 3201")).met).toBe(true);
    const fina = parsePrereqs("FINA 4121 or 4121H, 4321 or 4321H, 4422 or 5322, 4522, ACCT 5100 or ACCT 5101", "FINA")!;
    expect(checkPrereqs(fina, has("FINA 4121")).met).toBe(false);
    expect(checkPrereqs(fina, has("FINA 4121H", "FINA 4321", "FINA 5322", "FINA 4522", "ACCT 5101")).met).toBe(true);
  });

  it("still reads a list ending in ', or' as one list (MATH 4065)", () => {
    const node = parsePrereqs("1272 or 1372, 1572, or 2472", "MATH")!;
    for (const code of ["MATH 1272", "MATH 1372", "MATH 1572", "MATH 2472"]) expect(checkPrereqs(node, has(code)).met).toBe(true);
    expect(checkPrereqs(parsePrereqs("CSCI 1913, 1933, or 2021", "CSCI")!, has("CSCI 1933")).met).toBe(true);
    expect(checkPrereqs(parsePrereqs("CSCI 1913, 1933", "CSCI")!, has("CSCI 1933")).met).toBe(false);
  });

  it("ignores the courses after 'Credit will not be granted if …' (MICB 3303)", () => {
    const node = parsePrereqs(
      "Biol 1961 and Biol 2003 or Biol 1009 or instructor permission. Credit will not be granted if credit has been received for: BIOL 2032, MICB 3303, VBS 2032.",
      "MICB",
    )!;
    expect(checkPrereqs(node, has("BIOL 1009")).met).toBe(true);
    expect(parsePrereqs("Credit will not be granted if credit has been received for: BIOL 3020, Biol 4003, GCD 3022.", "BIOL")).toBeNull();
  });
});

// Review of #91: nine catalog strings the old parser read right and the first comma rule read wrong.
// Each is the literal text from data/catalog.db, checked with the courses the reviewer planned.
describe("commas: list readings the clause rule must keep (#91 review)", () => {
  const check = (text: string, dept: string, ...taken: string[]) => checkPrereqs(parsePrereqs(text, dept)!, has(...taken));

  it("EEB 3412W: 'one of the following' is one list, and 'Credit granted for only one of' isn't a prerequisite", () => {
    const text =
      "BIOL1951 or one of the following: BIOL1001, BIOL1003, BIOL1009, BIOL1012, BIOL1015, BIOL1052, BIOL1055, MATH1241, CHEM1081, CHEM1061, CHEM1071H, PHYS1221, PHYS1301W, PHYS1401V or instructor consent. Credit granted for only one of the following: EEB 3411, EEB 3412W or EEB 5412.";
    expect(check(text, "EEB", "BIOL 1951").met).toBe(true);
    expect(check(text, "EEB", "CHEM 1061").met).toBe(true);
    expect(JSON.stringify(parsePrereqs(text, "EEB"))).not.toContain("EEB 3412W");
  });

  it("ECON 3951, 4721, 4538: a cross-listed course after a comma is another way in, not a second requirement", () => {
    const econ = ["ECON 1101", "ECON 1102", "ECON 3101", "ECON 3102", "MATH 1271", "MATH 1272", "STAT 3011", "STAT 3022"];
    for (const text of [
      "(ECON 1101 or ECON 1165, APEC 1101), (ECON 1102 or APEC 1102), ECON 3101, ECON 3102, (STAT 3011 or STAT 3021), (STAT 3022 or STAT 3032), and Econ writing intensive elective or equivalent courses approved by the Economics Department",
      "(ECON 1101 or ECON 1165, APEC 1101), (ECON 1102 or APEC 1102), ECON 3101, ECON 3102, and MATH 1271, or equivalent courses approved by the Economics Department.",
      "(ECON 1101 or ECON 1165, APEC 1101), (ECON 1102 or APEC 1102), ECON 3101, ECON 3102, MATH 1271, MATH 1272, and two Econ electives or equivalent courses approved by the Economics Department.",
    ]) {
      expect(check(text, "ECON", ...econ).met).toBe(true);
      expect(check(text, "ECON", ...econ).missing).not.toContain("APEC 1101");
    }
  });

  it("ARTS 3180: '… one of the following courses: 1101, 1102, 1103, OR 1107' is one list", () => {
    const text = "Students must be a degree-seeking student and have taken one of the following courses:  1101, 1102, 1103, OR 1107.";
    expect(check(text, "ARTS", "ARTS 1102").met).toBe(true);
  });

  it("BIOL 3051: 'Biol 1951 and 2003, Biol 1009 or BMEN 2501' = (1951 and 2003) or 1009 or 2501", () => {
    const text = "Introductory biology such as Biol 1951 and 2003, Biol 1009 or BMEN 2501";
    expect(check(text, "BIOL", "BIOL 1009").met).toBe(true);
    expect(check(text, "BIOL", "BMEN 2501").met).toBe(true);
  });

  it("APEC 4311: '1101, 1102 or Econ 1101, 1102' accepts the ECON cross-listings", () => {
    expect(check("1101, 1102 or Econ 1101, 1102", "APEC", "ECON 1101", "ECON 1102").met).toBe(true);
  });

  it("NURS 6705 and APEC 8501: 'in 6704' is a corequisite in text, not the course IN 6704", () => {
    const nurs = "[6702, 6703] or instr consent, concurrent registration is required (or allowed) in 6704";
    expect(check(nurs, "NURS", "NURS 6702", "NURS 6703").met).toBe(true);
    expect(JSON.stringify(parsePrereqs(nurs, "NURS"))).not.toContain("IN 6704");
    const apec = "8003 or equiv or concurrent registration is required (or allowed) in 8003, 8211, 5032 or equiv";
    expect(check(apec, "APEC", "APEC 8003").met).toBe(true);
    // The numbers after "in 1061" continue the corequisite list, so they don't become CHEM prerequisites (CHEM 1065).
    expect(parsePrereqs("concurrent registration is required (or allowed) in 1061, 1071, 1071H, 1081", "CHEM")).toBeNull();
    // A bracket ends that list: "[3732 or …]" is FSCN 3732 again (FSCN 3731).
    const fscn = parsePrereqs(
      "[3102 or concurrent registration is required (or allowed) in  3102], [3732 or concurrent registration is required (or allowed) in  3732]",
      "FSCN",
    )!;
    expect(checkPrereqs(fscn, has("FSCN 3102", "FSCN 3732")).met).toBe(true);
    expect(JSON.stringify(fscn)).toContain('"FSCN 3732"');
  });
});
