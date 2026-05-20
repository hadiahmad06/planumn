import type { PlanNullable, Course, LockType } from "@/types/plan";

/**
 * Returns a new Plan with `course` appended to the semester at `semesterIndex`.
 * Used by the mobile add picker; desktop drag handler uses index-based splice
 * because the drop position matters.
 */
export function addCourseToSemester(
  plan: PlanNullable,
  course: Course,
  semesterIndex: string,
  lock: LockType = "unlocked"
): PlanNullable {
  return {
    ...plan,
    semesters: plan.semesters.map((sem) =>
      sem.index === semesterIndex
        ? { ...sem, courses: [...sem.courses, { id: course.id, lock }] }
        : sem
    ),
  };
}
