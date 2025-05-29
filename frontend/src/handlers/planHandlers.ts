import { Course, CourseCardCourse, Plan, Semester } from "@/types/plan";
import { useEffect } from "react";

export async function getCourseDetails(subject: string, number: string) {
  const response = await fetch(`/api/courses?subject=${subject}&number=${number}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch course details: ${response.statusText}`);
  }
  return response.json();
}

export function updateLock(
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

export function previewCourse(course: CourseCardCourse | null) {
  return window.postMessage({ type: 'PREVIEW_COURSE', course }, '*');
}

// export function getUpdateLockHandler(planState: Plan, setPlanState: (plan: Plan) => void) {
//   return handleUpdateLock(planState, setPlanState);
// }

// export function getPreviewCourseHandler() {
//   return handlePreviewCourse();
// }

export function usePlanMessageHandlers(planState: Plan, setPlanState: (plan: Plan) => void) {
  
}