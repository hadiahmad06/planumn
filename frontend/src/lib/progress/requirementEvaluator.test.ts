import { describe, expect, it } from "vitest";
import { evaluateRequirements } from "./requirementEvaluator";
import {
  makeCompleteCoursesRule,
  makeMinimumCoursesRule,
  makeMinimumCreditsRule,
  makePlannedCourse,
  makeReqGroup,
} from "./__fixtures__/builders";

describe("evaluateRequirements — render mode", () => {
  it("renders clean when every rule is completeCourses with enumerated leaves", () => {
    const group = makeReqGroup("Math Core", [
      makeCompleteCoursesRule(["101", "102", "103"]),
    ]);
    const [req] = evaluateRequirements([group], []);
    expect(req.renderMode).toBe("clean");
  });

  it("renders structured when any rule is minimumCourses", () => {
    const group = makeReqGroup("Math Core", [
      makeCompleteCoursesRule(["101", "102"]),
      makeMinimumCoursesRule(2, ["201", "202", "203"]),
    ]);
    const [req] = evaluateRequirements([group], []);
    expect(req.renderMode).toBe("structured");
  });
});

describe("evaluateRequirements — completeCourses slot counts", () => {
  it("reports n slots equal to the listed-course count", () => {
    const group = makeReqGroup("CS Core", [
      makeCompleteCoursesRule(["A", "B", "C", "D", "E"]),
    ]);
    const [req] = evaluateRequirements([group], []);
    expect(req.ruleProgress[0].slots).toBe(5);
    expect(req.ruleProgress[0].slotsFilled).toBe(0);
  });

  it("counts 3/5 when three of five enumerated courses are planned", () => {
    const group = makeReqGroup("CS Core", [
      makeCompleteCoursesRule(["10", "20", "30", "40", "50"]),
    ]);
    const planned = [
      makePlannedCourse(10),
      makePlannedCourse(20),
      makePlannedCourse(30),
    ];
    const [req] = evaluateRequirements([group], planned);
    expect(req.ruleProgress[0].slotsFilled).toBe(3);
    expect(req.ruleProgress[0].slots).toBe(5);
  });
});

describe("evaluateRequirements — minimumCourses(n)", () => {
  it("reports n slots, not the candidate-set size", () => {
    const candidates = Array.from({ length: 12 }, (_, i) => String(i + 100));
    const group = makeReqGroup("Electives", [
      makeMinimumCoursesRule(4, candidates),
    ]);
    const [req] = evaluateRequirements([group], []);
    expect(req.ruleProgress[0].slots).toBe(4);
  });

  it("caps at n when more than n candidates are planned", () => {
    const candidates = Array.from({ length: 12 }, (_, i) => String(i + 100));
    const group = makeReqGroup("Electives", [
      makeMinimumCoursesRule(4, candidates),
    ]);
    const planned = [100, 101, 102, 103, 104, 105].map((id) =>
      makePlannedCourse(id)
    );
    const [req] = evaluateRequirements([group], planned);
    expect(req.ruleProgress[0].slotsFilled).toBe(4);
    expect(req.ruleProgress[0].slots).toBe(4);
  });
});

describe("evaluateRequirements — minimumCredits", () => {
  it("reports 1 binary slot", () => {
    const group = makeReqGroup("Writing-intensive credits", [
      makeMinimumCreditsRule(8, ["1", "2", "3"]),
    ]);
    const [req] = evaluateRequirements([group], []);
    expect(req.ruleProgress[0].slots).toBe(1);
  });

  it("reports 0/1 when credits earned are below the floor", () => {
    const group = makeReqGroup("WI credits", [
      makeMinimumCreditsRule(8, ["1", "2", "3"]),
    ]);
    const planned = [
      makePlannedCourse(1, { creditMin: 3 }),
      makePlannedCourse(2, { creditMin: 2 }),
    ];
    const [req] = evaluateRequirements([group], planned);
    expect(req.ruleProgress[0].slotsFilled).toBe(0);
  });

  it("reports 1/1 when credits meet or exceed the floor", () => {
    const group = makeReqGroup("WI credits", [
      makeMinimumCreditsRule(8, ["1", "2", "3"]),
    ]);
    const planned = [
      makePlannedCourse(1, { creditMin: 4 }),
      makePlannedCourse(2, { creditMin: 5 }),
    ];
    const [req] = evaluateRequirements([group], planned);
    expect(req.ruleProgress[0].slotsFilled).toBe(1);
  });
});

describe("evaluateRequirements — pattern leaves", () => {
  it("surfaces a pattern satisfaction (not listing) for non-enumerated matches", () => {
    const group = makeReqGroup("Upper-div CSCI", [
      makeMinimumCoursesRule(1, ["any-3000-csci"]),
    ]);
    const planned = [
      makePlannedCourse(7777, { dept: "CSCI", num: "3081" }),
    ];
    const isPatternLeaf = (leaf: string) => leaf === "any-3000-csci";
    const matchesPattern = (c: any, leaf: string) =>
      leaf === "any-3000-csci" &&
      c.dept_abbr === "CSCI" &&
      parseInt(c.course_num, 10) >= 3000;

    const [req] = evaluateRequirements([group], planned, {
      isPatternLeaf,
      matchesPattern,
    });
    expect(req.renderMode).toBe("structured");
    expect(req.ruleProgress[0].slotsFilled).toBe(1);
    expect(req.ruleProgress[0].satisfactions[0]).toMatchObject({
      courseId: 7777,
      kind: "pattern",
    });
  });
});

describe("evaluateRequirements — multi-satisfaction across requirements", () => {
  it("includes the same course in both records' satisfactions", () => {
    const req1 = makeReqGroup("CS Core", [
      makeCompleteCoursesRule(["2021", "2033"]),
    ]);
    const req2 = makeReqGroup("Tech Electives", [
      makeMinimumCoursesRule(2, ["2021", "4011", "4041"]),
    ]);
    const planned = [
      makePlannedCourse(2021),
      makePlannedCourse(4041),
    ];

    const [r1, r2] = evaluateRequirements([req1, req2], planned);
    const r1Ids = r1.ruleProgress[0].satisfactions.map((s) => s.courseId);
    const r2Ids = r2.ruleProgress[0].satisfactions.map((s) => s.courseId);
    expect(r1Ids).toContain(2021);
    expect(r2Ids).toContain(2021);
  });
});
