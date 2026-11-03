import { describe, expect, it } from "vitest";
import { constraintProgress, describeConstraint, readCreditConstraints } from "./creditConstraints";

// Sentences as CourseDog writes them (CS B.S., EE B.E.E., Art History B.A., Plant Science B.S., 2026-10-27).
const read = (text: string, rule = "") => readCreditConstraints(text, rule).map(describeConstraint);

describe("readCreditConstraints (C2)", () => {
  it("reads CS's total and CSCI minimum", () => {
    const text =
      "The technical electives and one course to meet the upper division math-oriented requirement must total 23 credits minimum. Of the 23 credits, 11 must have a CSCI designator.";
    expect(read(text)).toEqual(["At least 23 credits in all", "At least 11 credits with a CSCI designator"]);
  });

  it("reads EE's total, list minimum and caps", () => {
    expect(
      read("Students must complete 34 total technical elective credits, with a minimum of 22 coming from the Core Department Electives (EE 4xxx/5xxx)."),
    ).toEqual(["At least 22 credits from Core Department Electives", "At least 34 credits in all"]);
    expect(read("Students may complete up to 12 credits of additional approved technical electives (outside the core department electives).")).toEqual([
      "At most 12 credits from additional approved technical electives",
    ]);
    expect(read("Students may take up to 4 credits total from this list to count as additional technical electives.")).toEqual(["At most 4 credits from this list"]);
  });

  it("takes a bullet's subject as the part it caps", () => {
    expect(read("• Non-EE 4000 and 5000 level coursework--maximum of 12 credits total.")).toEqual([
      "At most 12 credits from Non-EE 4000 and 5000 level coursework",
    ]);
  });

  it("tells the rule's own total from a part of it", () => {
    expect(read("Students must take at least 24 credits of Art History Electives.", "Art History Electives")).toEqual(["At least 24 credits in all"]);
    expect(read("Students must take at least 6 credits of 5xxx-level courses.", "Art History Electives")).toEqual(["At least 6 credits from 5xxx-level courses"]);
    expect(read("Take 20 or more credits from the following:")).toEqual(["At least 20 credits in all"]);
  });

  it("reads ranges and caps phrased as totals", () => {
    expect(read("Take 6 or more courses totaling 18 - 24 credits.")).toEqual(["18–24 credits in all"]);
    expect(read("A total of 6 credits from this list may count towards major electives.")).toEqual(["At most 6 credits from this list"]);
  });

  it("skips sentences that aren't about the rule, or are ambiguous", () => {
    expect(read("Students who choose this sub-plan will take a minimum of 34 credits to complete the Music BA.")).toEqual([]);
    expect(read("A maximum of 6 credits of CEGE 5xxx level courses may be double-counted to satisfy both degrees.")).toEqual([]);
    expect(read("Take at least 3 credits from each of the three historical eras.")).toEqual([]);
    expect(read("Choose an additional 6 credits from the elective list below.")).toEqual([]);
    expect(read("Take 6 or more credits focusing on religious life and 12 or more credits in an area of concentration.")).toEqual([]);
    expect(read("Of these 24 credits, students may count up to 9 lower-division credits.")).toEqual([]);
    expect(read("Students will take a minimum of 109 credits.")).toEqual([]);
    expect(read("")).toEqual([]);
  });

  // #82 second review: "each" spreads credits over lists, so "3 credits each from two areas" isn't a 3-credit total.
  it("skips any sentence with each, per-semester loads and grading basis", () => {
    expect(read("Take at least 3 credits each from two of the following areas.")).toEqual([]);
    expect(read("Students should take at least 15 credits per semester.")).toEqual([]);
    expect(read("Up to 3 credits may be taken S/N.")).toEqual([]);
    expect(read("A maximum of 4 credits may be taken A-F or S/N.")).toEqual([]);
  });

  // #82 second review: one reading for two lists was checked against the first list only.
  it("splits two amounts on two lists into one reading per list", () => {
    expect(read("Take 3 credits from Group A and 3 credits from Group B.")).toEqual(["At least 3 credits from Group A", "At least 3 credits from Group B"]);
    expect(read("Students may take up to 6 credits from Directed Study and 3 credits from Internships.")).toEqual([
      "At most 6 credits from Directed Study",
      "At most 3 credits from Internships",
    ]);
  });

  // Backlog after #82: the middle list of three was dropped, and a later list may leave out "credits".
  it("splits a list of three at commas, also when later amounts leave out 'credits'", () => {
    const three = ["At least 3 credits from Group A", "At least 3 credits from Group B", "At least 3 credits from Group C"];
    expect(read("Take 3 credits from Group A, 3 from Group B and 3 from Group C.")).toEqual(three);
    expect(read("Take 3 credits from Group A, 3 credits from Group B, and 3 credits from Group C.")).toEqual(three);
    expect(read("Take 3 credits from Group A and 3 from Group B.")).toEqual(three.slice(0, 2));
    // "from which" / "of these" point back at the first list: not a new one.
    expect(read("Take 12 credits from the following, 6 from which must be upper division.")).toEqual(["At least 12 credits in all"]);
  });

  // Backlog after #82: these read as a subject designator or as the rule's total. Choice: no reading.
  it("gives no reading for Lib Ed designators, levels and labs", () => {
    expect(read("6 credits must have the WI designator.")).toEqual([]);
    expect(read("Of the 12 credits, at least 3 credits must have a WI designator.")).toEqual([]);
    expect(read("Take at least 12 credits at the 3xxx level or higher.")).toEqual([]);
    expect(read("Students must complete at least 2 credits in a laboratory course.")).toEqual([]);
    // A real subject designator and a plain total still read.
    expect(read("Of the 23 credits, 11 must have a CSCI designator.")).toEqual(["At least 11 credits with a CSCI designator"]);
    expect(read("Must total 23 credits.")).toEqual(["At least 23 credits in all"]);
  });
});

describe("constraintProgress (C2)", () => {
  const listed = [
    { courseId: 1, code: "CSCI 4041" },
    { courseId: 2, code: "CSCI 5521" },
    { courseId: 3, code: "MATH 4242" },
    { courseId: 4, code: "EE 4389W" },
  ];
  const parts = [{ name: "Core Department Electives", courseIds: new Set([1, 4]) }];
  const planned = [
    { courseId: 1, credits: 4 },
    { courseId: 3, credits: 4 },
    { courseId: 4, credits: 3 },
    { courseId: 99, credits: 3 }, // not listed: never counts
  ];
  const progress = (text: string) => constraintProgress(readCreditConstraints(text), listed, parts, planned).map((p) => [p.planned, p.met]);

  it("sums planned credits of listed courses only", () => {
    expect(progress("Must total 23 credits.")).toEqual([[11, false]]);
  });

  it("counts a designator from the listed course's code", () => {
    expect(progress("Of the 23 credits, 4 must have a CSCI designator.")).toEqual([[4, true]]);
  });

  it("checks a named part when a child rule has that name, otherwise says it can't", () => {
    expect(progress("with a minimum of 22 coming from the Core Department Electives.")).toEqual([[7, false]]);
    expect(progress("up to 12 credits of additional approved technical electives.")).toEqual([[null, null]]);
  });

  it("checks each list of a split sentence on its own, and never guesses between lists", () => {
    const groups = [
      { name: "Group A", courseIds: new Set([1]) },
      { name: "Group B", courseIds: new Set([2]) },
    ];
    const check = (text: string) =>
      constraintProgress(readCreditConstraints(text), listed, groups, [{ courseId: 1, credits: 3 }]).map((p) => [p.planned, p.met]);
    expect(check("Take 3 credits from Group A and 3 credits from Group B.")).toEqual([
      [3, true],
      [0, false],
    ]);
    // Can't be split safely ("or"; one amount over two lists): can't check, not "met" from Group A alone.
    expect(check("Take 3 credits from Group A or 3 credits from Group B.")).toEqual([[null, null]]);
    expect(check("Take at least 6 credits from Group A and Group B.")).toEqual([[null, null]]);
  });

  it("treats a cap as met while under it", () => {
    expect(progress("up to 12 credits total from this list.")).toEqual([[11, true]]);
  });

  it("marks a bounded total met only inside its range", () => {
    const range = (credits: number[]) =>
      constraintProgress(
        readCreditConstraints("Take 6 or more courses totaling 18 - 24 credits."),
        credits.map((_, i) => ({ courseId: 100 + i, code: `CSCI 41${i}1` })),
        [],
        credits.map((c, i) => ({ courseId: 100 + i, credits: c })),
      ).map((p) => [p.planned, p.met]);
    expect(range([4, 4, 4, 4])).toEqual([[16, false]]);
    expect(range([4, 4, 4, 4, 4])).toEqual([[20, true]]);
    expect(range([4, 4, 4, 4, 4, 4])).toEqual([[24, true]]);
    expect(range([4, 4, 4, 4, 4, 4, 4])).toEqual([[28, false]]);
  });

  // #82 review: a range on a named list kept only its minimum ("At least 18 …") and read as met at 28.
  it("labels a named-list range as a range and marks it met only inside it", () => {
    const constraints = readCreditConstraints("Take 18 - 24 credits of Core Department Electives.", "Technical Electives");
    expect(constraints.map(describeConstraint)).toEqual(["18–24 credits from Core Department Electives"]);
    const range = (credits: number[]) => {
      const ids = credits.map((_, i) => 200 + i);
      return constraintProgress(
        constraints,
        ids.map((courseId, i) => ({ courseId, code: `EE 41${i}1` })),
        [{ name: "Core Department Electives", courseIds: new Set(ids) }],
        credits.map((c, i) => ({ courseId: ids[i], credits: c })),
      ).map((p) => [p.planned, p.met]);
    };
    expect(range([4, 4, 4, 4])).toEqual([[16, false]]);
    expect(range([4, 4, 4, 4, 4])).toEqual([[20, true]]);
    expect(range([4, 4, 4, 4, 4, 4, 4])).toEqual([[28, false]]);
  });
});
