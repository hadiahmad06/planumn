import { Course, CourseDetails } from "@/types/plan";
import { createContext, useContext, useState, ReactNode } from "react";

export type PreviewPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top" | "bottom" | "left" | "right";

export type PreviewSource = "search" | "plan" | null;

interface PreviewContextType {
  tempCourse: CourseDetails | Course | null;
  tempPos: PreviewPosition | null;
  persistCourse: CourseDetails | Course | null;
  persistPos: PreviewPosition | null;
  setTempPreview: (
    course: CourseDetails | Course | null,
    pos: PreviewPosition | null,
  ) => void;
  setPersistPreview: (
    course: CourseDetails | Course | null,
    pos: PreviewPosition | null,
  ) => void;
}

export const PreviewContext = createContext<PreviewContextType>({
  tempCourse: null,
  tempPos: null,
  persistCourse: null,
  persistPos: null,
  setTempPreview: () => {},
  setPersistPreview: () => {},
});
