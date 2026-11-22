import { describe, expect, it } from "vitest";
import { evaluateProgram, type PlannedForAudit, type Program, type RuleResult } from "@/domain/requirements";
import { catalogOption, findCourseIdsByCode, findCourseRowsByGroupIds, getCourses, listDepartments } from "@/server/catalog/courses";
import chlsFixture from "./__fixtures__/chls-ba.json";
import cwFixture from "./__fixtures__/creative-writing-minor.json";
import eeFixture from "./__fixtures__/ee-bee.json";
import { collectGroupIds, normalizeProgram, pickCurrentVersion, type RawProgram } from "./normalize";

/**
 * L11 review fix (#116, reviewers O and P; Hadi's Claude): two codes of one CourseDog course count once.
 * Real CourseDog programs (current versions on 2026-11-22, saved by `scripts/requirement-coverage.ts`)
 * resolved against data/catalog.db the way `getProgram` resolves them.
 */
function load(fixture: unknown): Program {
  const raw = pickCurrentVersion(fixture as Record<string, RawProgram>)!;
  const rows = findCourseRowsByGroupIds(collectGroupIds(raw));
  const resolve = (groupId: string) => {
    const r = rows.get(groupId);
    return r?.length ? catalogOption(groupId, r) : { groupId, courseId: null, code: null, title: null, credits: null, rows: [] };
  };
  return normalizeProgram(raw, resolve, undefined, new Set(listDepartments().map((d) => d.code)));
}

/** Planned courses as the rail builds them: catalog minimum credits and the course code. */
function plan(...codes: string[]): PlannedForAudit[] {
  const ids = findCourseIdsByCode(codes.map((c) => ({ dept: c.split(" ")[0], number: c.split(" ")[1] })));
  const courses = getCourses(codes.map((c) => ids.get(c)!));
  expect(courses).toHaveLength(codes.length);
  return courses.map((c) => ({ courseId: c.id, credits: c.credits.min, code: `${c.dept} ${c.number}` }));
}

const walk = (r: RuleResult): RuleResult[] => [r, ...(r.children ?? []).flatMap(walk)];
/** Every rule result named `name`, anywhere in the program. */
const rule = (p: Program, planned: PlannedForAudit[], name: string, catalogText: "count" | "show") =>
  evaluateProgram(p, planned, { catalogText })
    .requirements.flatMap((q) => q.rules.flatMap(walk))
    .find((r) => r.rule.name === name)!;
const planned = (r: RuleResult, kind: string) => r.constraints?.find((c) => c.constraint.kind === kind)?.planned;

describe("two codes of one course count once (L11 review fix)", () => {
  const ee = load(eeFixture);
  const cw = load(cwFixture);
  const chls = load(chlsFixture);

  it("EE B.E.E.: EE 4161W next to EE 4161 adds no specialty area, course or progress unit", () => {
    const base = plan("EE 4301", "EE 4231", "EE 4341", "EE 4161");
    const both = [...base, ...plan("EE 4161W")];
    const breadth = "Breadth and Depth Requirements (Technical Specialty Areas)";
    const te = "Electrical Engineering Technical Elective Program";
    expect(rule(ee, base, breadth, "count")).toMatchObject({ areas: 3, coursesCount: 4 });
    expect(rule(ee, both, breadth, "count")).toMatchObject({ areas: 3, coursesCount: 4 });
    const program = (p: PlannedForAudit[]) => evaluateProgram(ee, p, { catalogText: "count" }).requirements.find((q) => q.requirement.name === te)!;
    expect([program(base).filled, program(base).units]).toEqual([1, 5]);
    expect([program(both).filled, program(both).units]).toEqual([1, 5]);
  });

  it("Creative Writing Minor: ENGW 3102 + 3102W plan 3 credits of electives, not 6", () => {
    expect(planned(rule(cw, plan("ENGW 3102", "ENGW 3102W"), "Electives", "show"), "total")).toBe(3);
  });

  it("Chicano-Latino Studies B.A.: CHIC 3374 + CHLS 3374 + CHIC 3507W plan 7 credits of electives, not 10", () => {
    const p = plan("CHIC 3374", "CHLS 3374", "CHIC 3507W");
    expect(planned(rule(chls, p, "Electives", "show"), "total")).toBe(7);
    // The 4-credit CHIC 3374 is the row that counts (most credits); CHLS 3374 (3 credits) is not counted anywhere.
    const ids = evaluateProgram(chls, p).requirements.flatMap((q) => q.courseIds);
    expect(ids).toContain(p[0].courseId);
    expect(ids).not.toContain(p[1].courseId);
  });

  it("the fixtures list these courses as shared-group options", () => {
    const options = (p: Program) =>
      evaluateProgram(p, []).requirements.flatMap((q) => q.rules.flatMap(walk)).flatMap((r) => (r.rule.kind === "courses" ? r.rule.choices.flatMap((c) => c.options) : []));
    for (const [p, code] of [
      [ee, "EE 4161W"],
      [cw, "ENGW 3102W"],
      [chls, "CHIC 3374"],
    ] as const)
      expect(options(p).some((o) => o.rows.length > 1 && o.rows.some((r) => r.code === code))).toBe(true);
  });
});
