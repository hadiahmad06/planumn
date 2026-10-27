import { describe, expect, it } from "vitest";
import { getInstructorInsights } from "./instructors";
import { instructorGradeSummary } from "@/features/preview/instructor";
import { GET } from "@/app/api/courses/[courseId]/instructors/route";

describe("historical instructor insights", () => {
  it("aggregates a known instructor across terms for the requested Twin Cities course", () => {
    const instructors = getInstructorInsights(77);
    const kathryn = instructors.find(
      (instructor) => instructor.name === "Kathryn Jensen",
    )!;
    expect(kathryn.students).toBe(2304);
    expect(kathryn.terms).toHaveLength(7);
    expect(kathryn.terms[0]).toBe("1189");
    expect(kathryn.terms.at(-1)).toBe("1219");
    expect(instructorGradeSummary(kathryn.grades).total).toBe(2304);
    expect(instructors.map((instructor) => instructor.name)).toEqual(
      [...instructors.map((instructor) => instructor.name)].sort((a, b) =>
        a.localeCompare(b),
      ),
    );
  });
  it("does not expose another campus or unknown/invalid course ids", () => {
    for (const id of [8272, 999999999, -1, 1.5, NaN])
      expect(getInstructorInsights(id)).toEqual([]);
  });
  it("uses only letter grades for GPA and suppresses small samples", () => {
    expect(instructorGradeSummary({ A: 10, B: 10, S: 100, W: 5 })).toEqual({
      total: 125,
      letters: 20,
      gpa: 3.5,
    });
    expect(instructorGradeSummary({ A: 19 }).gpa).toBeNull();
    expect(instructorGradeSummary({ A: NaN, F: -5, W: 10 }).gpa).toBeNull();
  });
  it("validates public route params and returns historical aggregates", async () => {
    for (const courseId of ["-1", "1.5", "1e2", "9007199254740993", "abc"]) {
      expect(
        (
          await GET(new Request("https://planu.mn/api/courses/x/instructors"), {
            params: Promise.resolve({ courseId }),
          })
        ).status,
      ).toBe(400);
    }
    const response = await GET(
      new Request("https://planu.mn/api/courses/77/instructors"),
      { params: Promise.resolve({ courseId: "77" }) },
    );
    expect(response.status).toBe(200);
    expect(
      (await response.json()).some(
        (instructor: { name: string }) => instructor.name === "Kathryn Jensen",
      ),
    ).toBe(true);
  });
});
