import { Course, CourseCardCourse, Plan, Semester } from "@/types/plan";

export function handleUpdateLock(
  planState: Plan,
  setPlanState: (plan: Plan) => void
) {
  return (semIndex: string, course: Course) => {
    const updated = [...planState.semesters];
    const semIdx = updated.findIndex(s => s.index === semIndex);
    const courseIdx = updated[semIdx].courses.findIndex(c =>
      c.subject === course.subject &&
      c.number === course.number
    );
    const currentLock = updated[semIdx].courses[courseIdx].lock;
    updated[semIdx].courses[courseIdx].lock =
      currentLock === "locked" ? "unlocked" : "locked";
    setPlanState({ ...planState, semesters: updated });
  };
}

export function handlePreviewCourse() {
  return (course: CourseCardCourse | null) => {
    window.postMessage({ type: 'PREVIEW_COURSE', course }, '*');
  };
} 