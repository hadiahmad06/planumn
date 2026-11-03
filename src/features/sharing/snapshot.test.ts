import { describe, expect, it } from "vitest";
import { createEmptyPlan } from "@/domain/plan";
import {
  copySnapshot,
  decodeSnapshot,
  encodeSnapshot,
  MAX_SHARE_CHARS,
} from "./snapshot";

const tokenFor = (value: unknown) =>
  "v1." + Buffer.from(JSON.stringify(value)).toString("base64url");
describe("shared plan snapshots", () => {
  it("round-trips Unicode, programs, retakes and all lock states without cloud identity or lifecycle fields", () => {
    const plan = createEmptyPlan(new Date("2026-10-26"));
    plan.title = "Fall 📚 — résumé";
    plan.programs = ["000821107"];
    plan.id = "private-plan-identifier";
    plan.user_id = "private-owner-identifier";
    plan.can_view = ["private-viewer-identifier"];
    plan.deletion_scheduled_at = "2030-01-01T00:00:00Z";
    plan.semesters[0].courses = [
      { id: 87, lock: "locked" },
      { id: 88, lock: "autofilled" },
    ];
    plan.semesters[1].courses = [{ id: 87, lock: "unlocked" }];
    const before = structuredClone(plan);
    const token = encodeSnapshot(plan);
    expect(Buffer.from(token.slice(3), "base64url").toString()).not.toContain(
      "private-",
    );
    const received = decodeSnapshot(token, new Date("2027-01-01"));
    expect(received).toMatchObject({
      title: plan.title,
      programs: plan.programs,
      semesters: plan.semesters,
      id: null,
      user_id: null,
      can_view: [],
      deletion_scheduled_at: null,
    });
    expect(received.created_at).toBe("2027-01-01T00:00:00.000Z");
    expect(plan).toEqual(before);
    const copy = copySnapshot(plan, new Date("2028-01-01"));
    expect(copy.title).toBe(`${plan.title} (copy)`);
    expect(copy.id).toBeNull();
    expect(copy.created_at).toBe("2028-01-01T00:00:00.000Z");
    copy.semesters[0].courses.pop();
    expect(plan.semesters[0].courses).toHaveLength(2);
  });
  it("rejects malformed, future-version, truncated and oversized links", () => {
    for (const value of [
      "",
      "v2.abc",
      "v1.%%%",
      "v1.e30",
      "v1._w",
      "v1." + "A".repeat(MAX_SHARE_CHARS),
      tokenFor(["Title", [], []]) + "bad",
    ]) {
      expect(() => decodeSnapshot(value)).toThrow("incomplete or invalid");
    }
  });
  it("rejects invalid terms, course ids/locks, duplicate semesters, and excessive rows", () => {
    const bad = [
      ["Title", [], [["bad", []]]],
      ["Title", [], [["1269", [[-1, 0]]]]],
      ["Title", [], [["1269", [[87, 3]]]]],
      [
        "Title",
        [],
        [
          ["1269", []],
          ["1269", []],
        ],
      ],
      ["Title", [], [["1269", Array.from({ length: 101 }, () => [87, 0])]]],
      ["x".repeat(301), [], []],
      ["Title", [123], []],
      ["Title", [], [], { user_id: "forged" }],
    ];
    for (const value of bad)
      expect(() => decodeSnapshot(tokenFor(value))).toThrow();
  });
  it("bounds generated links without truncating the plan", () => {
    const plan = createEmptyPlan();
    for (const semester of plan.semesters)
      semester.courses = Array.from({ length: 100 }, (_, i) => ({
        id: i + 100000,
        lock: "locked",
      }));
    expect(() => encodeSnapshot(plan)).toThrow("too large");
    expect(plan.semesters[0].courses).toHaveLength(100);
  });
});
