import { Course, CourseDetails } from "@/types/plan";
import { ReactNode, useState } from "react";
import { CoursePreview, PreviewContext, PreviewPosition } from "./PreviewContext";
import { getCourseDetails } from "@/types/planHandlers";

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [tempPreview, setTempPreviewState] = useState<CoursePreview | null>(null);
  const [persistCourses, setPersistCourses] = useState<CoursePreview[]>([]);

  const setTempPreview = (course: CourseDetails | Course | null, pos: PreviewPosition = "bottom") => {
    if (course === null || pos === null) {
      setTempPreviewState(null);
    } else {
      setTempPreviewState({ course, pos });
      
      if (!("campus" in course)) {
        getCourseDetails(String(course.id)).then((fullCourse: CourseDetails) => {
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

    // Add placeholder preview immediately
    setPersistCourses(prev => [...prev, { course, pos }]);

    if (!("campus" in course)) {
      getCourseDetails(String(course.id)).then((fullCourse: CourseDetails) => {
        setPersistCourses(prev =>
          prev.map(entry =>
            "id" in entry.course && entry.course.id === course.id
              ? { ...entry, course: fullCourse }
              : entry
          )
        );
      });
    }
  };

  const removePersistPreview = (id: number) => {
    setPersistCourses(prev =>
      prev.filter(entry => 'id' in entry.course && entry.course.id !== id)
    );
  };

  return (
    <PreviewContext.Provider
      value={{
        tempCourse: tempPreview,
        persistCourses,
        setTempPreview,
        addPersistPreview,
        removePersistPreview,
      }}
    >
      {children}
    </PreviewContext.Provider>
  );
}