import { Course, CourseDetails } from "@/types/plan";
import { ReactNode, useState } from "react";
import { CoursePreview, CoursePreviewIndexed, PreviewContext, PreviewPosition } from "./PreviewContext";
import { getCourseDetails } from "@/types/planHandlers";

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [zIndexCounter, setZIndexCounter] = useState(1);

  const [tempPreview, setTempPreviewState] = useState<CoursePreview | null>(null);
  const [persistCourses, setPersistCourses] = useState<Record<number, CoursePreviewIndexed>>({});

  const setTempPreview = (course: CourseDetails | Course | null, pos: PreviewPosition = "bottom") => {
    if (course === null || pos === null) {
      setTempPreviewState(null);
    } else {
      setTempPreviewState({ course, pos });
      
      if (!("campus" in course)) {
        getCourseDetails(String(course.id)).then((fullCourse) => {
          if (!fullCourse) return;
          setTempPreviewState(prev =>
            prev && "id" in prev.course && prev.course.id === course.id
              ? { ...prev, course: fullCourse }
              : prev
          );
        });
      }
    }
  };

  const addPersistPreview = (course: CourseDetails | Course, initialPos: PreviewPosition | null) => {
    const pos = initialPos ?? "bottom";

    const nextZIndex = zIndexCounter + 1;
    setZIndexCounter(nextZIndex);
    setPersistCourses(prev => ({
      ...prev,
      [course.id]: {
        zIndex: nextZIndex,
        course: course,
        pos: pos
      },
    }));

    if (!("campus" in course)) {
      getCourseDetails(String(course.id)).then((fullCourse) => {
        if (!fullCourse) return;
        setPersistCourses(prev => {
          const entry = prev[course.id];
          if (!entry) return prev;
          return {
            ...prev,
            [course.id]: {
              ...entry,
              course: fullCourse
            },
          };
        });
      });
    }
  };

  const focusPersistPreview = (id: number) => {
    if (!(id in persistCourses)) return;
    
    const nextZIndex = zIndexCounter + 1;
    setZIndexCounter(nextZIndex);
    setPersistCourses(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        zIndex: nextZIndex,
      },
    }))
  };

  const removePersistPreview = (id: number) => {
    setPersistCourses(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  return (
    <PreviewContext.Provider
      value={{
        tempCourse: tempPreview,
        persistCourses,
        setTempPreview,
        addPersistPreview,
        focusPersistPreview,
        removePersistPreview,
      }}
    >
      {children}
    </PreviewContext.Provider>
  );
}