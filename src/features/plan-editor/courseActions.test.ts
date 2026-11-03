import { describe, expect, it } from "vitest";
import { courseActions } from "./courseActions";

describe("course actions (review of #22)", () => {
  it("doesn't offer moves into hidden seasons", () => {
    const labels = courseActions("1269", { id: 77, lock: "unlocked" }, undefined, ["summer"]).map((a) => a.label);
    expect(labels).toContain("Move to Spring 2027");
    expect(labels.some((l) => l.includes("Summer"))).toBe(false);
  });
});
