import { describe, expect, it } from "vitest";
import { createEmptyPlan } from "@/domain/plan";
import { decodeSnapshot, encodeSnapshot } from "./snapshot";

// Written by Ishaan's Claude (B2): share links carry placeholders and stay backward compatible.
const tokenFor = (value: unknown) => "v1." + Buffer.from(JSON.stringify(value)).toString("base64url");

describe("snapshot links with placeholders (B2)", () => {
  it("round-trips placeholders, including a Lib Ed code", () => {
    const plan = createEmptyPlan(new Date("2026-10-26"));
    plan.semesters[0].placeholders = [
      { key: "x1", label: "CSCI 3xxx elective", credits: 4 },
      { key: "x2", label: "Lib Ed: Global Perspectives", credits: 3, libEd: "GP" },
    ];
    const decoded = decodeSnapshot(encodeSnapshot(plan));
    expect(decoded.semesters[0].placeholders).toEqual([
      { key: "p1", label: "CSCI 3xxx elective", credits: 4 },
      { key: "p2", label: "Lib Ed: Global Perspectives", credits: 3, libEd: "GP" },
    ]);
    expect("placeholders" in decoded.semesters[1]).toBe(false);
  });

  it("still decodes links made before placeholders existed", () => {
    const plan = decodeSnapshot(tokenFor(["Old link", [], [["1269", [[87, 0]]]]]));
    expect(plan.semesters).toEqual([{ index: "1269", courses: [{ id: 87, lock: "unlocked" }] }]);
  });

  it("rejects malformed placeholders", () => {
    for (const bad of [
      [["", 3]],
      [["Label", -1]],
      [["Label", 3, "not a code"]],
      [["Label"]],
      "nope",
    ])
      expect(() => decodeSnapshot(tokenFor(["t", [], [["1269", [], bad]]]))).toThrow();
  });
});

describe("snapshot links with special semesters (B19)", () => {
  it("round-trips the semester kind, with or without placeholders", () => {
    const plan = createEmptyPlan(new Date("2026-10-26"));
    plan.semesters[1].kind = "abroad";
    plan.semesters[2].kind = "coop";
    plan.semesters[2].placeholders = [{ key: "k", label: "Co-op credit", credits: 1 }];
    const decoded = decodeSnapshot(encodeSnapshot(plan));
    expect(decoded.semesters[1]).toEqual({ index: plan.semesters[1].index, courses: [], kind: "abroad" });
    expect(decoded.semesters[2]).toMatchObject({ kind: "coop", placeholders: [{ label: "Co-op credit", credits: 1 }] });
    expect("kind" in decoded.semesters[0]).toBe(false);
  });

  it("rejects unknown kinds", () => {
    expect(() => decodeSnapshot(tokenFor(["t", [], [["1269", [], [], "vacation"]]]))).toThrow();
  });
});
