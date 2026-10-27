import { describe, expect, it } from "vitest";
import { createEmptyPlan, normalizeSemesters, placeholderCredits, type Plan } from "./plan";
import { addPlaceholder, cleanPlaceholder, removePlaceholder } from "./planOps";

// Written by Ishaan's Claude (B2 placeholder courses).
const plan = (): Plan => createEmptyPlan(new Date(2026, 3, 1)); // Fall 2026 = "1269"
const ph = (p: Plan, term: string) => p.semesters.find((s) => s.index === term)!.placeholders ?? [];

describe("placeholder courses (B2)", () => {
  it("adds, keeps keys unique, and removes", () => {
    let p = addPlaceholder(plan(), "1269", { label: "  CSCI 3xxx   elective ", credits: 3 }, "a");
    p = addPlaceholder(p, "1269", { label: "Lib Ed: Global Perspectives", credits: 3, libEd: "GP" }, "b");
    expect(ph(p, "1269")).toEqual([
      { key: "a", label: "CSCI 3xxx elective", credits: 3 },
      { key: "b", label: "Lib Ed: Global Perspectives", credits: 3, libEd: "GP" },
    ]);
    expect(addPlaceholder(p, "1269", { label: "dup", credits: 3 }, "a")).toBe(p);
    expect(placeholderCredits(p.semesters[0])).toBe(6);
    p = removePlaceholder(p, "1269", "a");
    expect(ph(p, "1269").map((x) => x.key)).toEqual(["b"]);
    expect(removePlaceholder(p, "1269", "missing")).toBe(p);
  });

  it("rejects empty labels and impossible credits", () => {
    expect(cleanPlaceholder({ label: "  ", credits: 3 })).toBeNull();
    expect(cleanPlaceholder({ label: "x", credits: -1 })).toBeNull();
    expect(cleanPlaceholder({ label: "x", credits: 21 })).toBeNull();
    expect(cleanPlaceholder({ label: "x", credits: Number.NaN })).toBeNull();
    expect(cleanPlaceholder({ label: "x", credits: 3.4 })).toEqual({ label: "x", credits: 3.5 });
  });

  it("leaves 2025 rows (no placeholders field) unchanged", () => {
    const s = normalizeSemesters([{ index: "1269", courses: [{ id: 1, lock: "unlocked" }] }]);
    expect(s).toEqual([{ index: "1269", courses: [{ id: 1, lock: "unlocked" }] }]);
    expect("placeholders" in s[0]).toBe(false);
  });

  it("merges duplicate terms: courses kept as-is, placeholders once per key", () => {
    const s = normalizeSemesters([
      { index: "1269", courses: [{ id: 1, lock: "unlocked" }], placeholders: [{ key: "a", label: "A", credits: 3 }] },
      { index: "1269", courses: [{ id: 1, lock: "locked" }, { id: 2, lock: "unlocked" }], placeholders: [{ key: "a", label: "A", credits: 3 }, { key: "b", label: "B", credits: 4 }] },
    ]);
    expect(s[0].courses.map((c) => c.id)).toEqual([1, 1, 2]);
    expect(s[0].placeholders!.map((p) => p.key)).toEqual(["a", "b"]);
  });
});
