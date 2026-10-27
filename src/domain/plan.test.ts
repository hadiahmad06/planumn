import { describe, expect, it } from "vitest";
import { createEmptyPlan, normalizeSemesters, plannedCourseIds } from "./plan";

describe("plan", () => {
  it("creates an empty 4-year plan in the 2025 row shape", () => {
    const p = createEmptyPlan(new Date(2026, 3, 1));
    expect(p.semesters).toHaveLength(12);
    expect(p.semesters[0]).toEqual({ index: "1269", courses: [] });
    expect(p).toMatchObject({ id: null, user_id: null, programs: [], can_view: [], deletion_scheduled_at: null });
  });

  it("sorts and merges semesters", () => {
    const s = normalizeSemesters([
      { index: "1263", courses: [{ id: 2, lock: "unlocked" }] },
      { index: "1259", courses: [] },
      { index: "1263", courses: [{ id: 3, lock: "locked" }] },
    ]);
    expect(s.map((x) => x.index)).toEqual(["1259", "1263"]);
    expect(s[1].courses.map((c) => c.id)).toEqual([2, 3]);
  });

  it("lists unique planned course ids", () => {
    const p = createEmptyPlan();
    p.semesters[0].courses.push({ id: 77, lock: "unlocked" }, { id: 87, lock: "unlocked" });
    p.semesters[1].courses.push({ id: 77, lock: "unlocked" });
    expect(plannedCourseIds(p)).toEqual([77, 87]);
  });
});
