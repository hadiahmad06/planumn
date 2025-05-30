import { Course, CourseDetails, Plan, PlanDetails, Semester, SemesterDetails } from "@/types/plan";
import { useEffect } from "react";

export async function getPlanDetails(plan: Plan): Promise<PlanDetails> {
  const semesters = await Promise.all(
    plan.semesters.map(async (semester: Semester) => {
      const courses = await Promise.all(
        semester.courses.map(async (course: Course) => {
          const courseDetails = await getCourseDetails(String(course.id));
          return {
            ...courseDetails,
            lock: course.lock || "unlocked", // Ensure lock has a default value
          } as CourseDetails;
        })
      );
      return {
        ...semester,
        courses,
      } as SemesterDetails;
    })
  );

  return {
    ...plan,
    semesters,
  } as PlanDetails;
}

export async function getCourseDetails(id:string) {
  const response = await fetch(`/api/courses?id=${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch course details: ${response.statusText}`);
  }
  return response.json();
}

export function updateLock(
  planState: PlanDetails,
  setPlanState: (plan: PlanDetails) => void
) {
  return (semIndex: string, course: Course) => {
    const updated = [...planState.semesters];
    const semIdx = updated.findIndex(s => s.index === semIndex);
    const courseIdx = updated[semIdx].courses.findIndex(c => c.id === course.id);

    const currentLock = updated[semIdx].courses[courseIdx].lock;
    updated[semIdx].courses[courseIdx].lock =
      currentLock === "locked" ? "unlocked" : "locked";
    setPlanState({ ...planState, semesters: updated });
  };
}

export function previewCourse(course: CourseDetails | null) {
  return window.postMessage({ type: 'PREVIEW_COURSE', course }, '*');
}
