import { describe, expect, it } from "vitest";
import { evaluateRequirements } from "./requirementEvaluator";
import { calculateGlobalProgress } from "./globalProgressCalculator";
import {
  makeCompleteCoursesRule,
  makeMinimumCreditsRule,
  makePlannedCourse,
  makeReqGroup,
} from "./__fixtures__/builders";

describe("calculateGlobalProgress — 13/25 baseline without dedupe", () => {
  it("returns naive sums when no course satisfies more than one requirement", () => {
    // Req1 has 13 slots, all filled. Req2 has 12 slots, none filled.
    const req1Ids = Array.from({ length: 13 }, (_, i) => String(i + 1));
    const req2Ids = Array.from({ length: 12 }, (_, i) => String(i + 14));
    const groups = [
      makeReqGroup("Req1", [makeCompleteCoursesRule(req1Ids)]),
      makeReqGroup("Req2", [makeCompleteCoursesRule(req2Ids)]),
    ];
    const planned = req1Ids.map((id) => makePlannedCourse(parseInt(id, 10)));

    const requirements = evaluateRequirements(groups, planned);
    expect(calculateGlobalProgress(requirements)).toEqual({
      met: 13,
      total: 25,
    });
  });
});

describe("calculateGlobalProgress — dedupe is visible", () => {
  it("counts a multi-satisfying course only once toward met", () => {
    // 25 total slots, 13 naive slot-fillings, but ONE course (id=12) is
    // listed in both Req1 and Req2. So distinct contributors = 12.
    const req1Ids = Array.from({ length: 13 }, (_, i) => String(i + 1));
    const req2Ids = ["12", ...Array.from({ length: 11 }, (_, i) =>
      String(i + 14)
    )];
    const groups = [
      makeReqGroup("Req1", [makeCompleteCoursesRule(req1Ids)]),
      makeReqGroup("Req2", [makeCompleteCoursesRule(req2Ids)]),
    ];
    // Plan: 12 courses (1..12). Course 12 satisfies both reqs.
    const planned = Array.from({ length: 12 }, (_, i) =>
      makePlannedCourse(i + 1)
    );

    const requirements = evaluateRequirements(groups, planned);
    expect(calculateGlobalProgress(requirements)).toEqual({
      met: 12,
      total: 25,
    });
  });
});

describe("calculateGlobalProgress — minimumCredits binary slot", () => {
  it("contributes 0/1 when credits are below the floor", () => {
    const group = makeReqGroup("WI", [
      makeMinimumCreditsRule(8, ["100", "101"]),
    ]);
    const planned = [
      makePlannedCourse(100, { creditMin: 3 }),
      makePlannedCourse(101, { creditMin: 3 }),
    ];
    const reqs = evaluateRequirements([group], planned);
    expect(calculateGlobalProgress(reqs)).toEqual({ met: 0, total: 1 });
  });

  it("contributes 1/1 when credits meet or exceed the floor", () => {
    const group = makeReqGroup("WI", [
      makeMinimumCreditsRule(8, ["100", "101"]),
    ]);
    const planned = [
      makePlannedCourse(100, { creditMin: 4 }),
      makePlannedCourse(101, { creditMin: 5 }),
    ];
    const reqs = evaluateRequirements([group], planned);
    expect(calculateGlobalProgress(reqs)).toEqual({ met: 1, total: 1 });
  });
});

describe("calculateGlobalProgress — electives are inert", () => {
  it("does not change met or total when an unrelated course is planned", () => {
    const group = makeReqGroup("CS Core", [
      makeCompleteCoursesRule(["1", "2", "3"]),
    ]);
    const planned = [makePlannedCourse(1), makePlannedCourse(2)];
    const baseline = calculateGlobalProgress(
      evaluateRequirements([group], planned)
    );

    // Add an elective (MUS 1014, not listed anywhere) → result unchanged.
    const withElective = [...planned, makePlannedCourse(9999, { dept: "MUS", num: "1014" })];
    const after = calculateGlobalProgress(
      evaluateRequirements([group], withElective)
    );

    expect(after).toEqual(baseline);
  });
});
