import { Course, CourseDetails } from "@/types/plan";
import { ReactNode, useState } from "react";
import { PreviewContext, PreviewPosition } from "./PreviewContext";

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [tempCourse, setTempCourse] = useState<CourseDetails | Course | null>(null);
  const [tempPos, setTempPos] = useState<PreviewPosition | null>(null);
  const [persistCourse, setPersistCourse] = useState<CourseDetails | Course | null>(null);
  const [persistPos, setPersistPos] = useState<PreviewPosition | null>(null);

  const setTempPreview = (
    course: CourseDetails | Course | null,
    pos: PreviewPosition | null,
  ) => {
    setTempCourse(course);
    setTempPos(pos);
  };

  const setPersistPreview = (
    course: CourseDetails | Course | null,
    pos: PreviewPosition | null,
  ) => {
    setPersistCourse(course);
    setPersistPos(pos);
  };

  return (
    <PreviewContext.Provider
      value={{
        tempCourse,
        tempPos,
        persistCourse,
        persistPos,
        setTempPreview,
        setPersistPreview,
      }}
    >
      {children}
    </PreviewContext.Provider>
  );
}