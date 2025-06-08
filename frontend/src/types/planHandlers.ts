import { PlanContext } from "@/contexts/PlanContext";
import { Course, CourseDetails, Semester } from "@/types/plan";
import { useContext, useEffect } from "react";

// export async function getPlanDetails(plan: Plan): Promise<PlanDetails> {
//   const semesters = await Promise.all(
//     plan.semesters.map(async (semester: Semester) => {
//       const courses = await Promise.all(
//         semester.courses.map(async (course: Course) => {
//           const courseDetails = await getCourseDetails(String(course.id));
//           return {
//             ...courseDetails,
//             lock: course.lock || "unlocked", // Ensure lock has a default value
//           } as CourseDetails;
//         })
//       );
//       return {
//         ...semester,
//         courses,
//       } as SemesterDetails;
//     })
//   );

//   return {
//     ...plan,
//     semesters,
//   } as PlanDetails;
// }

export async function getCourseDetails(id:string) {
  const response = await fetch(`/api/courses?id=${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch course details: ${response.statusText}`);
  }
  return response.json();
}

// export async function fetchCourseDetails (
//   courseDetails: Record<number, CourseDetails>, 
//   setCourseDetails: (courseDetails: Record<number, CourseDetails>) => void,
//   plan: PlanDetails) {
//       const details: Record<number, CourseDetails> = { ...courseDetails };
//       for (const semester of plan.semesters) {
//         for (const course of semester.courses) {
//           const key = course.id;
//           if (!details[key]) {
//             try {
//               const courseInfo = await getCourseDetails(key.toString());
//               if (courseInfo) {
//                 details[key] = {
//                   ...course,
//                   lock: course.lock || "locked"
//                 };
//               }
//             } catch (error) {
//               console.error(`Error fetching details for ${course.id}:`, error);
//               // Fall back to basic course info if fetch fails
//               details[key] = {
//                 ...course,
//                 class_desc: `unknown`,
//                 cred_min: 1,
//                 cred_max: 1,
//                 lock: course.lock || "unlocked"
//               };
//             }
//           }
//         }
//       }
//       setCourseDetails(details);
//     };

export function updateLock(semIndex: string, j: number){
  const { plan, setPlan } = useContext(PlanContext);
  if (!plan) return;

  const updated = [...plan.semesters];
  const semIdx = updated.findIndex(s => s.index === semIndex);
  // const courseIdx = updated[semIdx].courses.findIndex(c => c.id === course.id);

  const currentLock = updated[semIdx].courses[j].lock;
  updated[semIdx].courses[j].lock =
  currentLock === "locked" ? "unlocked" : "locked";
  setPlan({ ...plan, semesters: updated });
}

export function previewCourse(course: CourseDetails | null) {
  return window.postMessage({ type: 'PREVIEW_COURSE', course }, '*');
}
