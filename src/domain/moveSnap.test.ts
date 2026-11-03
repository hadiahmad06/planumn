import { describe, expect, it } from "vitest";
import { snapMove } from "./moveSnap";
import { createEmptyPlan, type Plan } from "./plan";
import { addCourse } from "./planOps";

// Fall 2026 ("1269") through Summer 2030, like a new plan.
const base = (): Plan => addCourse(createEmptyPlan(new Date(2026, 3, 1)), "1279", 7); // CSCI-ish course in Fall 2027
const FALL_ONLY = ["1179", "1189", "1199", "1209"];
const FALL_SPRING = ["1179", "1183", "1189", "1193"];

describe("snapMove (‹ › arrows)", () => {
  it("snaps a fall-only course to the previous or next fall", () => {
    expect(snapMove(base(), "1279", 7, "later", FALL_ONLY)).toEqual({ term: "1289", offeringKnown: true });
    expect(snapMove(base(), "1279", 7, "earlier", FALL_ONLY)).toEqual({ term: "1269", offeringKnown: true });
  });

  it("moves a fall/spring course to the adjacent offered term, skipping summer", () => {
    expect(snapMove(base(), "1279", 7, "later", FALL_SPRING)?.term).toBe("1283");
    expect(snapMove(base(), "1283", 7, "later", FALL_SPRING)?.term).toBe("1289");
  });

  it("uses any season when the offering history is too short", () => {
    expect(snapMove(base(), "1279", 7, "later", ["1179"])).toEqual({ term: "1283", offeringKnown: false });
    expect(snapMove(base(), "1279", 7, "later", undefined)?.term).toBe("1283");
  });

  it("skips hidden seasons, leave semesters and terms already holding the course", () => {
    expect(snapMove(base(), "1279", 7, "later", undefined, ["spring"])?.term).toBe("1285");
    let p = base();
    p = { ...p, semesters: p.semesters.map((s) => (s.index === "1289" ? { ...s, kind: "leave" as const } : s)) };
    expect(snapMove(p, "1279", 7, "later", FALL_ONLY)?.term).toBe("1299");
    p = addCourse(base(), "1289", 7);
    expect(snapMove(p, "1279", 7, "later", FALL_ONLY)?.term).toBe("1299");
  });

  it("stays within the plan's first and last semester", () => {
    expect(snapMove(base(), "1269", 7, "earlier", FALL_ONLY)).toBeNull();
    const p = addCourse(base(), "1299", 8);
    expect(snapMove(p, "1299", 8, "later", FALL_ONLY)).toBeNull();
  });
});
