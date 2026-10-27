import { describe, expect, it } from "vitest";
import type { CourseDogCourse } from "./coursedog";
import { coursesByRequestedId, isCourseDogId } from "./deprecatedIds";

// Shapes from CourseDog's course search, 2026-10-27 (CEGE 5218 kept its old id as deprecatedCourseGroupId).
const cege: CourseDogCourse = { courseGroupId: "8283131", deprecatedCourseGroupId: "aT7UWrjzP4lvMr3krIMi", code: "CEGE5218", name: "Methods for ITS", subjectCode: "CEGE", courseNumber: "5218" };
const chem: CourseDogCourse = { courseGroupId: "0036921", code: "CHEM1061", name: "Chem I", subjectCode: "CHEM", courseNumber: "1061" };

describe("old CourseDog course ids (C1c)", () => {
  it("maps old 20-character ids and current 7-digit ids to their course", () => {
    const m = coursesByRequestedId([cege, chem], ["aT7UWrjzP4lvMr3krIMi", "0036921", "nVzH5vryuHXiotc1enDx"]);
    expect(m.get("aT7UWrjzP4lvMr3krIMi")?.courseGroupId).toBe("8283131");
    expect(m.get("0036921")?.code).toBe("CHEM1061");
    expect(m.has("nVzH5vryuHXiotc1enDx")).toBe(false);
  });

  it("ignores courses nobody asked for", () => {
    expect(coursesByRequestedId([cege], ["0036921"]).size).toBe(0);
  });

  it("looks up only CourseDog-shaped ids", () => {
    expect(isCourseDogId("0036921")).toBe(true);
    expect(isCourseDogId("aT7UWrjzP4lvMr3krIMi")).toBe(true);
    expect(isCourseDogId("1CSCI****")).toBe(false);
    expect(isCourseDogId("")).toBe(false);
  });
});
