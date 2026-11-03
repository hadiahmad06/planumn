import { describe, expect, it } from "vitest";
import { currentVersions } from "./libEdIndex";

describe("currentVersions", () => {
  it("keeps the newest version in effect, else the earliest future one", () => {
    const rows = [
      { courseGroupId: "a", effectiveStartDate: "2018-09-04", attributes: ["CLE - GP (Global Perspectives)"] },
      { courseGroupId: "a", effectiveStartDate: "2024-01-16", attributes: [] },
      { courseGroupId: "a", effectiveStartDate: "2099-01-01", attributes: ["CLE - TS (Technology and Society)"] },
      { courseGroupId: "b", effectiveStartDate: "2099-09-01", attributes: [] },
      { courseGroupId: "b", effectiveStartDate: "2098-09-01", attributes: ["CLE - WI (Writing Intensive)"] },
    ];
    const best = currentVersions(rows, "2026-10-27");
    expect(best.get("a")?.effectiveStartDate).toBe("2024-01-16");
    expect(best.get("b")?.effectiveStartDate).toBe("2098-09-01");
  });
});
