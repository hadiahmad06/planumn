import { Course, CourseCardCourse, Plan, Semester } from "@/types/plan";
import { useEffect } from "react";

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

export function getUpdateLockHandler(planState: Plan, setPlanState: (plan: Plan) => void) {
  return handleUpdateLock(planState, setPlanState);
}

export function getPreviewCourseHandler() {
  return handlePreviewCourse();
}

export function usePlanMessageHandlers(planState: Plan, setPlanState: (plan: Plan) => void) {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'DRAG_END') {
        const { source, destination } = event.data.result;
        if (!destination) return;

        const updated = [...planState.semesters];

        const destSem = updated[Number(destination.droppableId)];
        if (!destSem.courses) destSem.courses = [];

        if (source.droppableId === "search") {
          const courseData = JSON.parse(event.data.result.draggableId) as Course;
          destSem.courses.splice(destination.index, 0, {
            ...courseData,
            lock: "unlocked"
          });
        } else {
          const sourceSem = updated[Number(source.droppableId)];
          const [moved] = sourceSem.courses.splice(source.index, 1);
          destSem.courses.splice(destination.index, 0, moved);
        }

        setPlanState({ ...planState, semesters: updated });
      } else if (event.data.type === 'AUTOFILL') {
        const updated = [...planState.semesters];
        let moved = false;
        for (const sem of updated) {
          if (moved) break;
          for (const c of sem.courses) {
            if (c.lock === "unlocked") {
              c.lock = "autofilled";
              moved = true;
              break;
            }
          }
        }
        setPlanState({ ...planState, semesters: updated });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [planState]);
}