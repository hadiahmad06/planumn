import { describe, expect, it } from "vitest";
import { averageGpa, semesterWorkload } from "./workload";

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
