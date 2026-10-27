import { describe, expect, it } from "vitest";
import { parseNaturalQuery } from "./naturalQuery";

const depts = [
  { code: "CSCI", name: "Computer Science" },
  { code: "MATH", name: "Mathematics" },
  { code: "ECON", name: "Economics" },
  { code: "WRIT", name: "Writing Studies" },
];

describe("parseNaturalQuery (B27)", () => {
  it("turns a sentence into filters", () => {
    const r = parseNaturalQuery("easy 3 credit fall classes with no prereqs for global perspectives", depts)!;
    expect(r.filters).toEqual({ credits: 3, noPrereqs: true, minGpa: 3.5, libEd: "GP", season: "fall" });
    expect(r.text).toBe("");
    expect(r.understood.map((u) => u.label)).toEqual([
      "3 credits",
      "No prerequisites",
      "Avg GPA 3.50+",
      "Lib Ed: Global Perspectives",
      "Offered in Fall",
    ]);
  });

  it("keeps leftover words for the title search and finds departments by name", () => {
    expect(parseNaturalQuery("intro computer science classes about data in spring", depts)).toMatchObject({
      text: "about data",
      filters: { level: 1000, dept: "CSCI", season: "spring" },
    });
    expect(parseNaturalQuery("3xxx math courses with gpa above 3.2", depts)?.filters).toEqual({ level: 3000, dept: "MATH", minGpa: 3.2 });
    expect(parseNaturalQuery("writing intensive econ", depts)?.filters).toEqual({ libEd: "WI", dept: "ECON" });
  });

  it("leaves plain searches to the regular search", () => {
    for (const q of ["csci 2041", "CSCI2041", "2041", "discrete structures", "math", "global politics", ""]) expect(parseNaturalQuery(q, depts)).toBeNull();
  });

  it("doesn't read generic words as Lib Ed themes", () => {
    expect(parseNaturalQuery("environmental science fall", depts)).toMatchObject({ text: "environmental science", filters: { season: "fall" } });
  });
});
