import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { CreditConstraint } from "@/domain/creditConstraints";
import { evaluateProgram, type Program, type Rule } from "@/domain/requirements";
import { CatalogTextLabel, catalogTextMode, ProgramCatalogTextBadge, programLabel, programWarning, requirementLabel, requirementWarning } from "./CatalogTextWarning";
import { RequirementItem } from "./RequirementItem";

// Hadi, 2026-11-04 (Hadi's Claude): only APAS-checked programs count catalog-text readings, tentatively;
// every program shows ⚠ N.
const EE = "026421707";
const text = (kind: CreditConstraint["kind"], credits: number): CreditConstraint => ({ kind, credits, source: "text", sentence: "" });
const coded = (id: number, code: string) => ({ groupId: String(id), courseId: id, code, title: null, credits: null });
const electives: Rule = {
  kind: "courses",
  id: "te",
  name: "Technical Electives",
  notes: null,
  constraints: [text("total", 12)],
  choices: [{ options: [coded(1, "EE 4111")] }],
  minCourses: 1,
  minCredits: 0,
};
const program = (id: string): Program => ({
  id,
  name: "P",
  type: "Major",
  requirements: [
    { id: "core", name: "Core", notes: null, rules: [{ ...electives, id: "core", constraints: undefined }] },
    { id: "te", name: "Technical Electives", notes: null, rules: [electives] },
  ],
});
const planned = [{ courseId: 1, credits: 4, code: "EE 4111" }];
const html = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);

describe("⚠ N and its wording on counted and shown-only programs", () => {
  const ee = evaluateProgram(program(EE), planned);
  const other = evaluateProgram(program("other"), planned);

  it("counts EE (its progress changes) and not another program (its progress equals show mode)", () => {
    expect(catalogTextMode(ee)).toMatchObject({ counted: true, check: { audits: 1 } });
    expect(catalogTextMode(other)).toEqual({ counted: false, check: undefined });
    expect(ee.units).toBeGreaterThan(evaluateProgram(program(EE), planned, { catalogText: "show" }).units);
    expect(other).toEqual(evaluateProgram(program("other"), planned, { catalogText: "show" }));
  });

  it("renders ⚠ N on the program header and the requirement row of both", () => {
    for (const result of [ee, other]) {
      const header = html(createElement(ProgramCatalogTextBadge, { result }));
      expect(header).toContain('aria-label="1 requirement of 2 includes parts read from catalog text"');
      expect(header).toMatch(/<\/svg>1<\/span>$/);
      const row = html(createElement(RequirementItem, { result: result.requirements[1], mode: catalogTextMode(result) }));
      expect(row).toContain('aria-label="1 part read from catalog text"');
      // A full requirement gets no badge.
      expect(html(createElement(RequirementItem, { result: result.requirements[0], mode: catalogTextMode(result) }))).not.toContain("catalog text");
    }
  });

  it("says in the tooltips whether this program's readings count, tentatively, or are only shown", () => {
    const reading = { count: 1, cantCheck: 0 };
    expect(requirementWarning(reading, catalogTextMode(ee))).toContain("For this program they count in your progress, tentatively: a temporary choice while more APAS audits are checked.");
    expect(programWarning(1, 2, catalogTextMode(ee))).toContain("tentatively");
    for (const s of [requirementWarning(reading, catalogTextMode(other)), programWarning(1, 2, catalogTextMode(other))]) {
      expect(s).toContain("For this program they're only shown, not counted in your progress.");
      expect(s).not.toContain("APAS audit (");
    }
    // Program-wide, never "agreed with a real APAS audit" (EE has readings APAS never paired).
    const eeTip = requirementWarning(reading, catalogTextMode(ee));
    expect(eeTip).toContain("checked this program's readings against one real APAS audit (2026-11-03); that check may not have covered every requirement");
    expect(eeTip).not.toMatch(/agreed/);
  });

  it("uses singular and plural labels", () => {
    expect(requirementLabel(1)).toBe("1 part read from catalog text");
    expect(requirementLabel(3)).toBe("3 parts read from catalog text");
    expect(programLabel(1, 1)).toBe("1 requirement of 1 includes parts read from catalog text");
    expect(programLabel(1, 5)).toBe("1 requirement of 5 includes parts read from catalog text");
    expect(programLabel(2, 5)).toBe("2 requirements of 5 include parts read from catalog text");
    expect(requirementWarning({ count: 1, cantCheck: 0 }, { counted: false })).toMatch(/^1 part of this requirement was read/);
    expect(requirementWarning({ count: 2, cantCheck: 0 }, { counted: false })).toMatch(/^2 parts of this requirement were read/);
  });

  it("labels counted boxes tentative, with the disclaimer, and shown-only boxes not counted", () => {
    const counted = html(createElement(CatalogTextLabel, { mode: catalogTextMode(ee), what: "these credit limits", shownTitle: "shown" }));
    expect(counted).toContain("Read from catalog text · counted in progress (tentative)");
    expect(counted).toContain("student-made planner, not UMN&#x27;s official degree audit");
    expect(counted).toContain("a temporary choice while more APAS audits are checked");
    const shown = html(createElement(CatalogTextLabel, { mode: catalogTextMode(other), what: "these credit limits", shownTitle: "shown" }));
    expect(shown).toBe('<p class="text-text-tertiary" title="shown">Read from catalog text · not counted in progress</p>');
    // The expanded rows carry the same labels.
    const open = (result: typeof ee) => html(createElement(RequirementItem, { result: result.requirements[1], defaultOpen: true, mode: catalogTextMode(result) }));
    expect(open(ee)).toContain("counted in progress (tentative)");
    expect(open(other)).toContain("Read from catalog text · not counted in progress");
    expect(open(other)).not.toContain("student-made planner");
  });
});
