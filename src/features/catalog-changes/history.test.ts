import { describe, expect, it } from "vitest";
import {
  compareCatalog,
  emptyHistory,
  readHistory,
  rememberCatalog,
  MAX_HISTORY,
  type CatalogItem,
} from "./history";
const item = (id = 1, hash = "a"): CatalogItem => ({
  key: `course:${id}`,
  label: "CSCI 2011",
  summary: "Synthetic public course",
  fingerprint: hash.repeat(64),
});
const check = (
  items: CatalogItem[],
  checkedAt = "2026-10-28T12:00:00Z",
  unavailable: string[] = [],
) => ({ items, checkedAt, unavailable });
it("establishes a first reference and compares only observed items without treating missing data as removal", () => {
  const first = check([item()]);
  expect(compareCatalog(emptyHistory(), first)).toEqual({
    changed: [],
    firstSeen: 1,
  });
  const saved = rememberCatalog(emptyHistory(), first);
  expect(compareCatalog(saved, first)).toEqual({ changed: [], firstSeen: 0 });
  const missing = check([], undefined, ["CSCI 2011"]);
  expect(compareCatalog(saved, missing).changed).toEqual([]);
  expect(rememberCatalog(saved, missing).items).toEqual(saved.items);
});
it("keeps differences visible until explicitly remembered and preserves other catalog references", () => {
  const saved = rememberCatalog(emptyHistory(), check([item(1), item(2)]));
  const before = structuredClone(saved);
  const next = check([item(1, "b")], "2026-11-01T12:00:00Z");
  expect(compareCatalog(saved, next).changed).toHaveLength(1);
  expect(compareCatalog(saved, next).changed[0].lastChecked).toBe(
    "2026-10-28T12:00:00Z",
  );
  const acknowledged = rememberCatalog(saved, next);
  expect(compareCatalog(acknowledged, next).changed).toEqual([]);
  expect(acknowledged.items["course:2"]).toEqual(saved.items["course:2"]);
  expect(saved).toEqual(before);
});
it("does not replace a newer acknowledged observation with an older in-flight check", () => {
  const newer = rememberCatalog(
    emptyHistory(),
    check([item(1, "b")], "2026-11-02T12:00:00Z"),
  );
  expect(
    rememberCatalog(newer, check([item(1)], "2026-11-01T12:00:00Z")).items,
  ).toEqual(newer.items);
});
it("bounds history to the newest public observations", () => {
  const older = rememberCatalog(
    emptyHistory(),
    check(Array.from({ length: MAX_HISTORY }, (_, i) => item(i + 1))),
  );
  const next = rememberCatalog(
    older,
    check([item(MAX_HISTORY + 1)], "2026-11-01T12:00:00Z"),
  );
  expect(Object.keys(next.items)).toHaveLength(MAX_HISTORY);
  expect(next.items[`course:${MAX_HISTORY + 1}`]).toBeDefined();
});
describe("saved catalog reference validation", () => {
  it("round-trips valid history and accepts absent history", () => {
    expect(readHistory(null)).toEqual(emptyHistory());
    const saved = rememberCatalog(emptyHistory(), check([item()]));
    expect(readHistory(JSON.stringify(saved))).toEqual(saved);
  });
  it("rejects malformed/unsupported history rather than silently declaring no changes", () => {
    for (const raw of [
      "oops",
      "null",
      "{}",
      JSON.stringify({ version: 2, items: {} }),
      JSON.stringify({
        version: 1,
        items: { bad: { item: item(), checkedAt: "bad" } },
      }),
    ])
      expect(() => readHistory(raw)).toThrow("could not be read");
  });
});
