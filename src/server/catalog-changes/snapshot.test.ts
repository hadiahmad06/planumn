import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("next/cache", () => ({ cacheLife: vi.fn() }));
vi.mock("@/server/programs/coursedog", () => ({
  fetchProgramVersions: vi.fn(),
}));
import { fetchProgramVersions } from "@/server/programs/coursedog";
import {
  catalogCheck,
  catalogFingerprint,
  chooseCourseVersion,
} from "./snapshot";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});
it("canonicalizes object keys, preserves list order and detects source changes", () => {
  expect(catalogFingerprint({ name: "Example", rules: { b: 2, a: 1 } })).toBe(
    catalogFingerprint({ rules: { a: 1, b: 2 }, name: "Example" }),
  );
  expect(catalogFingerprint([1, 2])).not.toBe(catalogFingerprint([2, 1]));
  expect(catalogFingerprint({ a: 1 })).not.toBe(catalogFingerprint([["a", 1]]));
});
it("chooses the newest started course version, otherwise the nearest future version", () => {
  const rows = [
    { courseGroupId: "1", effectiveStartDate: "2028-01-01" },
    { courseGroupId: "1", effectiveStartDate: "2026-01-01" },
    { courseGroupId: "1", effectiveStartDate: "2027-01-01" },
  ];
  expect(chooseCourseVersion(rows, "2026-10-28")?.effectiveStartDate).toBe(
    "2026-01-01",
  );
  expect(chooseCourseVersion(rows, "2025-01-01")?.effectiveStartDate).toBe(
    "2026-01-01",
  );
});
describe("public source snapshots", () => {
  it("hashes selected public catalog metadata without retaining a whole source/plan record", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({
            data: [
              {
                courseGroupId: "0036721",
                subjectCode: "CSCI",
                courseNumber: "2011",
                name: "Discrete Structures",
                effectiveStartDate: "2024-09-01",
                credits: { creditHours: { min: 4, max: 4 } },
                privateIgnored: "not retained",
              },
            ],
          }),
        ),
    );
    vi.mocked(fetchProgramVersions).mockResolvedValue({
      v: {
        programGroupId: "P",
        name: "Synthetic program",
        effectiveStartDate: "2024-09-01",
        requisites: {},
        requirementLevels: [],
      },
    });
    const result = await catalogCheck([77], ["P"], new Date("2026-10-28"));
    expect(result.items.map((i) => i.key)).toEqual(["course:77", "program:P"]);
    expect(result.items[0].summary).toContain("4 cr");
    expect(JSON.stringify(result)).not.toContain("privateIgnored");
    expect(result.unavailable).toEqual([]);
  });
  it("reports unknown courses or source failures as unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    vi.mocked(fetchProgramVersions).mockRejectedValue(new Error("offline"));
    const result = await catalogCheck([77, 999999999], ["P"]);
    expect(result.items).toEqual([]);
    expect(result.unavailable).toEqual([
      "CSCI 2011",
      "Course 999999999",
      "Program P",
    ]);
  });
});
