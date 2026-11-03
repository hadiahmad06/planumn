import { describe, expect, it } from "vitest";
import { libEdCodes, libEdCoverage, TWIN_CITIES_LIBED } from "./libed";
import { createEmptyPlan } from "./plan";
import { addCourse, addPlaceholder } from "./planOps";

const plan = () => createEmptyPlan(new Date(2026, 3, 1)); // Fall 2026 … Summer 2030
const covered = (r: ReturnType<typeof libEdCoverage>, code: string) =>
  r.coverage
    .find((c) => c.designation.code === code)!
    .courses.map((c) => (c.kind === "course" ? `${c.courseId}@${c.term}` : `slot:${c.label}@${c.term}`));

describe("Lib Ed designations (B3)", () => {
  it("lists the 7 core areas, 5 themes and Writing Intensive", () => {
    expect(TWIN_CITIES_LIBED.filter((d) => d.group === "core")).toHaveLength(7);
    expect(TWIN_CITIES_LIBED.filter((d) => d.group === "theme")).toHaveLength(5);
    expect(TWIN_CITIES_LIBED.map((d) => d.code)).toContain("WI");
  });

  it("reads CourseDog CLE attributes and ignores everything else", () => {
    // Real attributes from the UMN catalog (ENGL 1001W, AFRO 1011).
    expect(libEdCodes(["CLE - LITR (Literature)", "CLE - WI (Writing Intensive)", "ONL - ONLINE (Online may be available)"])).toEqual(["LITR", "WI"]);
    expect(libEdCodes(["CLE - DSJ (Race, Power, and Justice US)"])).toEqual(["DSJ"]);
    expect(libEdCodes(["CLE - XYZ (Not a Twin Cities code)", 7, null])).toEqual([]);
    expect(libEdCodes(undefined)).toEqual([]);
  });
});

describe("libEdCoverage (B3)", () => {
  it("maps planned courses to designations, earliest term once, and counts pending/unknown", () => {
    let p = addCourse(plan(), "1269", 1); // ECON 1101: SOCS + GP
    p = addCourse(p, "1273", 2); // ENGL 1001W: LITR + WI
    p = addCourse(p, "1279", 1); // retake: listed once, at Fall 2026
    p = addCourse(p, "1273", 3); // still loading
    p = addCourse(p, "1283", 4); // not in the UMN catalog
    const r = libEdCoverage(p, { 1: ["SOCS", "GP"], 2: ["LITR", "WI"], 4: null });
    expect(covered(r, "SOCS")).toEqual(["1@1269"]);
    expect(covered(r, "GP")).toEqual(["1@1269"]);
    expect(covered(r, "WI")).toEqual(["2@1273"]);
    expect(covered(r, "BIOL")).toEqual([]);
    expect(r).toMatchObject({ pending: 1, unknown: 1 });
  });

  it("lists Lib Ed placeholder slots under their designation, after real courses (B2)", () => {
    let p = addCourse(plan(), "1269", 1);
    p = addPlaceholder(p, "1273", { label: "Lib Ed: Global Perspectives", credits: 3, libEd: "GP" }, "a");
    p = addPlaceholder(p, "1273", { label: "CSCI elective", credits: 4 }, "b");
    const r = libEdCoverage(p, { 1: ["GP"] });
    expect(covered(r, "GP")).toEqual(["1@1269", "slot:Lib Ed: Global Perspectives@1273"]);
    expect(r.coverage.flatMap((c) => c.courses).filter((c) => c.kind === "slot")).toHaveLength(1);
  });

  it("is empty for an empty plan", () => {
    const r = libEdCoverage(plan(), {});
    expect(r.coverage.every((c) => c.courses.length === 0)).toBe(true);
    expect(r).toMatchObject({ pending: 0, unknown: 0 });
  });
});
