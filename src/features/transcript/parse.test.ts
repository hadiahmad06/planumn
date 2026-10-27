import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { transcriptCourses, transcriptPlan } from "./parse";
import { extractTranscriptText } from "./pdf";
describe("UMN transcript import", () => {
  it("merges repeated term headers, deduplicates within a term and preserves retakes", () => {
    const terms = transcriptCourses(
      "University of Minnesota Fall Semester 2022 CSCI 1133 CSCI 1133 Fall Semester 2022 MATH 1271 Spring Semester 2023 CSCI 1133 ZZZZ 9999",
    );
    const result = transcriptPlan(
      terms,
      new Map([
        ["CSCI 1133", 87],
        ["MATH 1271", 88],
      ]),
      new Date("2026-10-26"),
    );
    expect(result.matched).toBe(3);
    expect(result.plan.semesters[0]).toEqual({
      index: "1229",
      courses: [
        { id: 87, lock: "locked" },
        { id: 88, lock: "locked" },
      ],
    });
    expect(result.unmatched).toEqual(["ZZZZ 9999"]);
    expect(result.plan.user_id).toBeNull();
    expect(result.plan.semesters.at(-1)?.index).toBe("1275");
    expect(result.plan.semesters.map((s) => s.index)).toContain("1235");
    expect(result.plan.semesters.map((s) => s.index)).toContain("1263");
  });
  it("rejects non-UMN text, missing semesters and wholly unmatched transcripts", () => {
    expect(() => transcriptCourses("Fall Semester 2022 CSCI 1133")).toThrow();
    expect(() => transcriptCourses("University of Minnesota")).toThrow();
    expect(() =>
      transcriptPlan(
        transcriptCourses(
          "University of Minnesota Fall Semester 2022 ZZZZ 9999",
        ),
        new Map(),
      ),
    ).toThrow();
  });
  it("reads course codes from a real synthetic PDF without importing identity text", async () => {
    const pdf = await readFile(
      "src/features/transcript/fixtures/synthetic-transcript.pdf",
    );
    const text = await extractTranscriptText(pdf);
    const result = transcriptPlan(
      transcriptCourses(text),
      new Map([
        ["CSCI 1133", 87],
        ["CSCI 2011", 77],
      ]),
    );
    expect(result.matched).toBe(2);
    expect(JSON.stringify(result)).not.toContain("Synthetic Student");
  });
});
