import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ApasRequirement } from "@/domain/apas";
import type { ApasComparison, ApasPair } from "@/domain/apasCompare";
import { ApasProgramSummary, ApasSaysLine } from "./ApasSays";

const apas = (title: string, status: ApasRequirement["status"], credits: number | null = null): ApasRequirement => ({
  id: title.toUpperCase(),
  title,
  status,
  earned: { credits: null, courses: null },
  inProgress: { credits: null, courses: null },
  needs: credits == null ? null : { credits, courses: null, groups: null, subrequirements: null },
  subrequirements: [],
});
const pair = (a: ApasRequirement, name: string, satisfied: boolean, verdict: ApasPair["verdict"], units = 1): ApasPair => ({
  apas: a,
  target: { level: "requirement", requirementId: name, id: name, name, satisfied, units, filled: satisfied ? 1 : 0 },
  match: "exact",
  verdict,
});
const html = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el).replace(/<!-- -->/g, "");

describe("APAS says (C4 display)", () => {
  it("labels the line as APAS's own result and says what planu.mn makes of the same courses", () => {
    const out = html(createElement(ApasSaysLine, { pair: pair(apas("Technical Electives", "incomplete", 10), "Technical Electives", true, "disagree") }));
    expect(out).toContain("APAS says:");
    expect(out).toContain("not complete, needs 10 credits");
    expect(out).toContain("planu.mn: met with the same courses");
    expect(out).toContain("APAS&#x27;s own result");
  });

  it("shows APAS's title when the names only matched as similar, and 'can't check' when planu.mn counts nothing", () => {
    const p = { ...pair(apas("Upper Division Writing Intensive", "complete"), "Writing Intensive", false, "unchecked", 0), match: "similar" as const };
    const out = html(createElement(ApasSaysLine, { pair: p }));
    expect(out).toContain("Upper Division Writing Intensive");
    expect(out).toContain("planu.mn can&#x27;t check this one");
  });

  it("summarizes disagreements per program", () => {
    const comparison: ApasComparison = {
      pairs: [pair(apas("Core", "complete"), "Core", true, "agree"), pair(apas("Electives", "incomplete"), "Electives", true, "disagree")],
      apasOnly: [apas("Minimum Degree Credits", "in-progress")],
      planumnOnly: [{ id: "x", name: "Senior Project" }],
      ignored: [],
      disagreements: 1,
    };
    const out = html(createElement(ApasProgramSummary, { audit: { preparedOn: "10/27/2026 02:02 PM" } as never, comparison }));
    expect(out).toContain("Compared with your APAS audit");
    expect(out).toContain("(prepared 10/27/2026 02:02 PM)");
    expect(out).toContain("1 disagreement");
    expect(out).toContain("in 2 matched requirements");
  });
});
