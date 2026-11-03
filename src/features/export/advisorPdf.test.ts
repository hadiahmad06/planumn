import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import type { CourseSummary } from "@/domain/course";
import { createEmptyPlan } from "@/domain/plan";
import { extractTranscriptText } from "@/features/transcript/pdf";
import { advisorFileName, createAdvisorPdf } from "./advisorPdf";

const course = (id: number): CourseSummary => ({
  id,
  dept: "CSCI",
  number: String(1000 + id),
  title: `Synthetic course ${id}`,
  credits: { min: 4, max: 4 },
});
describe("advisor PDF export", () => {
  it("fits a standard four-year plan on one A4 landscape page and keeps the source unchanged", async () => {
    const plan = createEmptyPlan(new Date("2026-10-26T12:00:00Z"));
    plan.title = "Synthetic four-year plan";
    const courses: Record<number, CourseSummary> = {};
    let id = 1;
    for (const semester of plan.semesters) {
      if (semester.index.endsWith("5")) continue;
      for (let i = 0; i < 4; i++) {
        courses[id] = course(id);
        semester.courses.push({ id: id++, lock: "unlocked" });
      }
    }
    const before = JSON.stringify(plan);
    const result = await createAdvisorPdf(plan, courses, {
      programNames: ["Computer Science B.S."],
      audits: [{ name: "Computer Science B.S.", filled: 7, units: 16 }],
    });
    const pdf = await PDFDocument.load(result.bytes);
    expect(pdf.getPageCount()).toBe(1);
    expect(pdf.getPage(0).getWidth()).toBeCloseTo(841.89);
    expect(JSON.stringify(plan)).toBe(before);
    const text = await extractTranscriptText(Buffer.from(result.bytes));
    expect(text).toContain("CSCI 1001");
    expect(text).toContain("CSCI 1032");
    expect(text).toContain("7/16");
    expect(text).toContain("not an official degree audit");
  });
  it("continues dense semesters across pages without omitting the last course", async () => {
    const plan = createEmptyPlan(new Date("2026-10-26T12:00:00Z"));
    const courses: Record<number, CourseSummary> = {};
    for (let id = 1; id <= 100; id++) {
      courses[id] = course(id);
      plan.semesters[0].courses.push({ id, lock: "unlocked" });
    }
    const result = await createAdvisorPdf(plan, courses);
    expect(result.pages).toBeGreaterThan(1);
    expect((await PDFDocument.load(result.bytes)).getPageCount()).toBe(
      result.pages,
    );
    const text = await extractTranscriptText(Buffer.from(result.bytes));
    expect(text).toContain("CSCI 1100");
    expect(text).toContain("continued");
  });
  it("marks missing catalog details and accepts unsupported title glyphs", async () => {
    const plan = createEmptyPlan(new Date("2026-10-26T12:00:00Z"));
    plan.title = "Résumé — Fall 📚";
    plan.semesters[0].courses.push({ id: 777, lock: "locked" });
    const result = await createAdvisorPdf(plan, {});
    expect(result.missingCourses).toBe(1);
    const pdf = await PDFDocument.load(result.bytes);
    expect(pdf.getTitle()).toBe(plan.title);
    expect(await extractTranscriptText(Buffer.from(result.bytes))).toContain(
      "Catalog details unavailable",
    );
  });
  it("produces a safe PDF filename", () => {
    expect(advisorFileName("../../My plan: 2026")).toBe(
      "planumn-My-plan-2026.pdf",
    );
    expect(advisorFileName("")).toBe("planumn-plan.pdf");
  });
});
