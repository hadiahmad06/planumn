import { beforeAll, describe, expect, it } from "vitest";
import { evaluateProgram, type CourseOption, type Program } from "@/domain/requirements";
import { catalogOption, findCourseRowsByGroupIds } from "./courses";
import { catalog } from "./db";

/** L11 (Hadi's Claude): requirement options against data/catalog.db's shared CourseDog group ids. */
describe("shared CourseDog group ids in data/catalog.db (L11)", () => {
  let engw: CourseOption;
  let chls: CourseOption;
  beforeAll(async () => {
    const rows = await findCourseRowsByGroupIds(["0049451", "0031151"]);
    engw = catalogOption("0049451", rows.get("0049451") ?? []);
    chls = catalogOption("0031151", rows.get("0031151") ?? []);
  });

  it("resolves a group to every row, newest offering first", () => {
    expect(engw.rows.map((r) => r.code)).toEqual(["ENGW 1102W", "ENGW 1102"]);
    expect(engw).toMatchObject({ courseId: 8090, code: "ENGW 1102W" });
    expect(chls.rows.map((r) => r.code)).toEqual(["CHLS 1112", "CHIC 1112"]);
    expect(chls).toMatchObject({ courseId: 11019, code: "CHLS 1112" });
  });

  it("ENGW 1102W and CHLS 1112 satisfy their options", () => {
    const program: Program = {
      id: "P",
      name: "P",
      type: "Major",
      requirements: [engw, chls].map((o) => ({
        id: o.groupId,
        name: o.groupId,
        notes: null,
        rules: [{ kind: "courses", id: o.groupId, name: o.groupId, notes: null, choices: [{ options: [o] }], minCourses: 1, minCredits: 0 }],
      })),
    };
    for (const ids of [[8090, 11019], [703, 3996]]) {
      const r = evaluateProgram(program, ids.map((courseId) => ({ courseId, credits: 3 })));
      expect(r.requirements.every((q) => q.satisfied)).toBe(true);
    }
  });

  it("suggests a row offered at least as recently as every other row of its group, for every shared group", async () => {
    const shared = await (await catalog()).all<{ g: string }>(
      `SELECT courseGroupId AS g FROM classdistribution WHERE campus = 'UMNTC' AND courseGroupId IS NOT NULL
       GROUP BY courseGroupId HAVING COUNT(*) > 1`,
    );
    expect(shared.length).toBeGreaterThan(100);
    const all = await findCourseRowsByGroupIds(shared.map((s) => s.g));
    for (const { g } of shared) {
      const list = all.get(g)!;
      const option = catalogOption(g, list);
      expect(option.rows).toHaveLength(list.length);
      const newest = Math.max(...list.map((r) => Number(r.lastTerm ?? 0)));
      expect(Number(list.find((r) => r.id === option.courseId)!.lastTerm ?? 0)).toBe(newest);
    }
  });
});
