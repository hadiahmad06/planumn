import { Course, CourseDetails } from "@/types/plan";
import { createContext, useContext, useState, ReactNode } from "react";

export type PreviewPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top" | "bottom" | "left" | "right";

export type PreviewSource = "search" | "plan" | null;

export type CoursePreview = {
  course: CourseDetails | Course;
  pos: PreviewPosition;
}

export type HydratedPreview = {
  course: CourseDetails;
  pos: PreviewPosition;
};

type zIndex = {
  zIndex: number
}

export type CoursePreviewIndexed = CoursePreview & zIndex;

interface PreviewContextType {
  tempCourse: CoursePreview | null;
  persistCourses: Record<number, CoursePreviewIndexed>;
  setTempPreview: (
    course: CourseDetails | Course | null,
    pos?: PreviewPosition,
  ) => void;
  addPersistPreview: (
    course: CourseDetails | Course,
    initialPos: PreviewPosition | null
  ) => void;
  focusPersistPreview: (id: number) => void;
  removePersistPreview: (id: number) => void;
}

export const PreviewContext = createContext<PreviewContextType>({
  tempCourse: null,
  persistCourses: {},
  setTempPreview: () => {},
  addPersistPreview: () => {},
  focusPersistPreview: () => {},
  removePersistPreview: () => {},
});
