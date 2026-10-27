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
