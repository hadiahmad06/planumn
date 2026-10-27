import { describe, expect, it } from "vitest";
import { averageGpa, semesterWorkload, semesterWorkloadStatus } from "./workload";

describe("workload (B7)", () => {
  it("averages letter grades and ignores S/N/W", () => {
    expect(averageGpa({ A: 50, B: 50, S: 1000, W: 10 })).toBeCloseTo(3.5);
    expect(averageGpa({ A: 5 })).toBeNull(); // too few grades to judge
  });

  it("rates low-GPA, high-credit semesters heavier", () => {
    const hard = { credits: 4, grades: { B: 40, C: 40, D: 20 } }; // ~2.4
    const easy = { credits: 4, grades: { A: 80, B: 20 } }; // ~3.8
    expect(semesterWorkload([hard, hard, hard, hard]).level).toBe("heavy");
    expect(semesterWorkload([easy, easy, easy]).level).toBe("light");
    expect(semesterWorkload([easy, easy, hard, easy]).level).toBe("moderate");
    expect(semesterWorkload([]).gpa).toBeNull();
  });
});

// Review fix by Ishaan's Claude (#34): never rate a semester from a partial set of course details.
describe("workload with partial catalog data (review of #34)", () => {
  const four = { credits: { min: 4 }, grades: { A: 80, B: 20 } };

  it("waits while any course's details are still loading", () => {
    // Four 4-credit courses, only one cached: this used to read as a "light" 4-credit semester.
    expect(semesterWorkloadStatus([1, 2, 3, 4], { 1: four }, {})).toEqual({ status: "loading" });
  });

  it("says incomplete (not light) when a course isn't in the catalog", () => {
    expect(semesterWorkloadStatus([1, 2, 3, 4], { 1: four, 2: four, 3: four }, { 4: true })).toEqual({
      status: "incomplete",
      unavailable: 1,
    });
  });

  it("rates the whole semester once every course has details", () => {
    const r = semesterWorkloadStatus([1, 2, 3, 4], { 1: four, 2: four, 3: four, 4: four }, {});
    expect(r).toMatchObject({ status: "ready", workload: { credits: 16 } });
    expect(semesterWorkloadStatus([], {}, {})).toEqual({ status: "empty" });
  });
});
