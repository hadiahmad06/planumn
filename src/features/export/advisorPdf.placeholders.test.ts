import { describe, expect, it } from "vitest";
import type { CourseSummary } from "@/domain/course";
import { createEmptyPlan } from "@/domain/plan";
import { extractTranscriptText } from "@/features/transcript/pdf";
import { createAdvisorPdf } from "./advisorPdf";

// Written by Ishaan's Claude (B2): placeholder slots appear in the advisor PDF and count toward credits.
describe("advisor PDF with placeholder slots (B2)", () => {
  it("lists slots after courses and adds their credits", async () => {
    const plan = createEmptyPlan(new Date("2026-10-26T12:00:00Z"));
    const course: CourseSummary = { id: 1, dept: "CSCI", number: "1133", title: "Intro", credits: { min: 4, max: 4 } };
    plan.semesters[0].courses.push({ id: 1, lock: "unlocked" });
    plan.semesters[0].placeholders = [{ key: "a", label: "Lib Ed: Global Perspectives", credits: 3, libEd: "GP" }];
    const result = await createAdvisorPdf(plan, { 1: course });
    const text = await extractTranscriptText(Buffer.from(result.bytes));
    expect(text).toContain("Slot");
    expect(text).toContain("Lib Ed: Global Perspectives");
    expect(text).toMatch(/\b7 cr\b/); // Fall 2026: 4 + 3
  });
});

describe("advisor PDF with special semesters (B19)", () => {
  it("names the term's kind in its heading", async () => {
    const plan = createEmptyPlan(new Date("2026-10-26T12:00:00Z"));
    plan.semesters[1].kind = "abroad";
    const text = await extractTranscriptText(Buffer.from((await createAdvisorPdf(plan, {})).bytes));
    expect(text).toContain("Study abroad");
  });
});
