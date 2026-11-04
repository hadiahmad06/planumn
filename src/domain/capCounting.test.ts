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

describe("a min on a part honours the caps inside it (bug 3, #94 review)", () => {
  const items: [number, string][] = [
    [11, "EE 4111"],
    [12, "EE 4231"],
    [13, "EE 4301"],
  ];
  const core: Rule = {
    kind: "allOf",
    id: "core",
    name: "Core Department Electives",
    notes: null,
    children: [list("extra", "Core Extra", items, { constraints: [text("max", 4)] })],
  };
  // The same three courses, uncapped, outside Core.
  const additional = list("add", "Additional Approved Technical Electives", items);
  const requirement = (constraints: CreditConstraint[]): Requirement => ({ id: "te", name: "Technical Elective Program", notes: null, rules: [core, additional], constraints });

  it("reads 4 of 12 from Core, not 12, when a list outside Core lists Core's capped courses", () => {
    const r = one(requirement([text("min", 12, "Core Department Electives")]), at4(...items));
    expect(r.constraints?.[0]).toMatchObject({ planned: 4, met: false });
    expect(r.satisfied).toBe(false);
  });

  it("still frees the courses for the requirement's total, through the uncapped list outside Core", () => {
    const r = one(requirement([text("total", 12), text("min", 12, "Core Department Electives")]), at4(...items));
    expect(r.constraints?.map((p) => [p.planned, p.met])).toEqual([
      [12, true],
      [4, false],
    ]);
  });
});

describe("a part's counted sum never exceeds what it can hold under its own caps (property, fixed seed)", () => {
  let seed = 94;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pick = (n: number) => Math.floor(random() * n);
  const courses = Array.from({ length: 8 }, (_, i): [number, string] => [i + 1, `EE 4${i}01`]);

  interface Node {
    rule: Rule;
    cap?: number;
    children: Node[];
    ids: number[];
  }
  let names = 0;
  function node(depth: number): Node {
    const name = `Part ${++names}`;
    const cap = random() < 0.35 ? 1 + pick(8) : undefined;
    const constraints = cap ? [text("max", cap)] : undefined;
    if (depth < 3 && random() < 0.45) {
      const children = Array.from({ length: 1 + pick(3) }, () => node(depth + 1));
      return { rule: { kind: "allOf", id: name, name, notes: null, constraints, children: children.map((c) => c.rule) }, cap, children, ids: children.flatMap((c) => c.ids) };
    }
    const own = courses.filter(() => random() < 0.4);
    const chosen = own.length ? own : [courses[pick(courses.length)]];
    return { rule: list(name, name, chosen, { constraints }), cap, children: [], ids: chosen.map(([id]) => id) };
  }
  const flat = (n: Node): Node[] => [n, ...n.children.flatMap(flat)];

  it("holds for 300 random requirements", () => {
    for (let i = 0; i < 300; i++) {
      names = 0;
      const top = Array.from({ length: 1 + pick(3) }, () => node(0));
      const credit = new Map(courses.map(([id]) => [id, 1 + pick(4)]));
      const planned = courses.filter(() => random() < 0.7).map(([courseId, code]) => ({ courseId, code, credits: credit.get(courseId)! }));
      const plannedCredits = (ids: Iterable<number>) => {
        const set = new Set(ids);
        return planned.filter((p) => set.has(p.courseId)).reduce((n, p) => n + p.credits, 0);
      };
      // Upper bound: the credits a part's lists hold, honouring every cap inside the part (its own included).
      const bound = (n: Node): number =>
        Math.min(n.cap ?? Infinity, n.children.length ? n.children.reduce((s, c) => s + bound(c), 0) : Infinity, plannedCredits(n.ids));
      const parts = top.flatMap(flat);
      const constraints = [text("total", 1), ...parts.map((n) => text("min", 1, n.rule.name))];
      const r = one({ id: "r", name: "R", notes: null, rules: top.map((n) => n.rule), constraints }, planned);
      const [total, ...mins] = r.constraints!;
      expect(total.planned, `case ${i}, total`).toBeLessThanOrEqual(Math.min(top.reduce((s, n) => s + bound(n), 0), plannedCredits(parts.flatMap((n) => n.ids))));
      parts.forEach((n, k) => {
        expect(mins[k].planned, `case ${i}, ${n.rule.name}`).not.toBeNull();
        expect(mins[k].planned!, `case ${i}, ${n.rule.name}`).toBeLessThanOrEqual(bound(n));
      });
    }
  });
});
