import { describe, expect, it } from "vitest";
import type { CreditConstraint } from "./creditConstraints";
import { evaluateProgram, type CoursesRule, type PlannedForAudit, type Requirement, type Rule } from "./requirements";

// Regressions for the two cap bugs Claude reviewer A found on #93 (built from the review's shapes), under
// counting (Hadi, 2026-11-04: catalog-text readings count, tentatively, for APAS-checked programs).
const text = (kind: CreditConstraint["kind"], credits: number, scope?: string): CreditConstraint => ({ kind, credits, scope, source: "text", sentence: "" });
const coded = (id: number, code: string) => ({ groupId: String(id), courseId: id, code, title: null, credits: null });
const list = (id: string, name: string, items: [number, string][], extra: Partial<CoursesRule> = {}): CoursesRule => ({
  kind: "courses",
  id,
  name,
  notes: null,
  choices: items.map(([i, code]) => ({ options: [coded(i, code)] })),
  minCourses: 0,
  minCredits: 0,
  ...extra,
});
const one = (requirement: Requirement, planned: PlannedForAudit[]) =>
  evaluateProgram({ id: "x", name: "X", type: "Major", requirements: [requirement] }, planned, { catalogText: "count" }).requirements[0];
const at4 = (...items: [number, string][]): PlannedForAudit[] => items.map(([courseId, code]) => ({ courseId, credits: 4, code }));

describe("a requirement's total and caps (bug 1)", () => {
  const business = list("biz", "Business", [[1, "MGMT 3001"], [2, "MGMT 3002"]], { constraints: [text("max", 4)] });
  const other = list("other", "Other", [[3, "ECON 3101"]]);
  const planned = at4([1, "MGMT 3001"], [2, "MGMT 3002"], [3, "ECON 3101"]);

  it("caps the total by a top-level rule's 'at most 4 credits from this list', as inside an allOf", () => {
    const top = one({ id: "r", name: "Electives", notes: null, rules: [business, other], constraints: [text("total", 12)] }, planned);
    expect(top.constraints?.[0]).toMatchObject({ planned: 8, met: false });
    expect(top).toMatchObject({ satisfied: false, units: 1, filled: 0 });
    const group: Rule = { kind: "allOf", id: "g", name: "Electives", notes: null, constraints: [text("total", 12)], children: [business, other] };
    expect(one({ id: "r", name: "Electives", notes: null, rules: [group] }, planned).rules[0].constraints?.[0]).toMatchObject({ planned: 8, met: false });
  });

  it("applies the requirement's own 'max 4 from Business' to its total, as on a rule", () => {
    const uncapped = { ...business, constraints: undefined };
    const readings = [text("total", 12), text("max", 4, "Business")];
    const own = one({ id: "r", name: "Electives", notes: null, rules: [uncapped, other], constraints: readings }, planned);
    expect(own.constraints?.[0]).toMatchObject({ planned: 8, met: false });
    expect(own).toMatchObject({ satisfied: false, filled: 0 });
    const group: Rule = { kind: "allOf", id: "g", name: "Electives", notes: null, constraints: readings, children: [uncapped, other] };
    expect(one({ id: "r", name: "Electives", notes: null, rules: [group] }, planned).rules[0].constraints?.[0]).toMatchObject({ planned: 8, met: false });
  });
});

describe("a cap limits only its own part (bug 2, EE shape)", () => {
  const eePattern = { terms: [{ subjects: ["EE"], levels: [4, 5] }], exceptSubjects: [], exclude: [], include: [], forms: [], sentences: [] };
  const coreListed: [number, string][] = [
    [11, "EE 4111"],
    [12, "EE 4231"],
    [13, "EE 4301"],
    [14, "EE 4505"],
    [15, "EE 4161W"],
  ];
  const core: Rule = {
    kind: "allOf",
    id: "core",
    name: "Core Department Electives",
    notes: null,
    children: [
      list("core-list", "Core EE electives", coreListed),
      { kind: "text", id: "core-pat", name: "Additional 4xxx/5xxx EE courses", notes: null, text: "", pattern: eePattern },
    ],
  };
  const additionalItems: [number, string][] = [
    [21, "CSCI 4041"],
    [22, "MATH 4242"],
    [23, "PHYS 4101"],
    [24, "EE 5364"],
  ];
  const additional = list("add", "Additional Approved Technical Electives", additionalItems, {
    constraints: [text("max", 12, "Additional Approved Technical Electives")],
  });
  const ee: Requirement = {
    id: "te",
    name: "Technical Elective Program",
    notes: null,
    rules: [core, additional],
    constraints: [text("total", 34), text("min", 22, "Core Department Electives")],
  };
  const readings = (r: Requirement, planned: PlannedForAudit[]) => one(r, planned).constraints?.map((p) => [p.planned, p.met]);
  const met = [
    [36, true],
    [24, true],
  ];

  it("keeps EE 5364's credits in Core (its pattern) when Additional is over its cap, in either plan order", () => {
    const planned = at4(...coreListed, ...additionalItems);
    expect(readings(ee, planned)).toEqual(met);
    expect(readings(ee, [...planned].reverse())).toEqual(met);
    expect(one(ee, planned)).toMatchObject({ satisfied: true, units: 1, filled: 1 });
    // EE 5111 matches the pattern only: the same answer.
    expect(readings(ee, at4(...coreListed, ...additionalItems.slice(0, 3), [25, "EE 5111"]))).toEqual(met);
  });

  it("gives the same readings and progress whatever the plan order", () => {
    // Over the cap through Additional alone, with a min that shares Additional's courses, so which course loses credit matters.
    const extra = { ...additional, choices: [...additional.choices, { options: [coded(26, "CSCI 4061")] }] };
    const r: Requirement = { ...ee, rules: [core, extra], constraints: [...ee.constraints!, text("min", 8, "Additional Approved Technical Electives")] };
    const planned = at4(...coreListed.slice(0, 3), ...additionalItems, [26, "CSCI 4061"], [25, "EE 5111"]);
    const base = one(r, planned);
    let seed = 7;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 25; i++) {
      const shuffled = planned
        .map((p) => ({ p, k: random() }))
        .sort((a, b) => a.k - b.k)
        .map((x) => x.p);
      const result = one(r, shuffled);
      expect(result.constraints).toEqual(base.constraints);
      expect([result.satisfied, result.units, result.filled]).toEqual([base.satisfied, base.units, base.filled]);
    }
  });
});
