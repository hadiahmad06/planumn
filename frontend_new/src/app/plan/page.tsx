"use client";

import { useState, useEffect } from "react";
import SettingsPanel from "@/components/SettingsPanel";
import SearchBar from "@/components/SearchBar";
import CoursePreviewPanel from "@/components/CoursePreviewPanel";
import { Box, Flex, Text, VStack, Heading } from "@chakra-ui/react";
import GlobalSearchLayout from "@/components/GlobalSearchLayout";
import PlanDisplay from "@/components/PlanDisplay";
import { ColorKey, Course, CourseCardCourse, Plan, Semester } from "@/types/plan";
import { getUpdateLockHandler, getPreviewCourseHandler, usePlanMessageHandlers } from "@/handlers/planHandlers";

// Create a new empty plan
const createEmptyPlan = (): Plan => {
  const currentYear = new Date().getFullYear();
  const semesters: Semester[] = [];
  
  // Create 12 semesters (4 years)
  for (let i = 0; i < 12; i++) {
    const baseYear = Math.floor(i / 3) + currentYear;
    const year = i % 3 === 0 ? baseYear : baseYear + 1; // We start with Fall of the current year
    const season = i % 3 === 0 ? '9' : i % 3 === 1 ? '3' : '5'; // 9=Fall, 3=Spring, 5=Summer
    semesters.push({
      index: `1${year.toString().slice(2)}${season}`,
      courses: []
    });
  }
  
  return {
    createdAt: new Date(),
    major: ["Computer Science B.S."],
    semesters
  };
};

export default function NewPlanPage() {
  const [planState, setPlanState] = useState<Plan>(createEmptyPlan());
  const [colorKey, setColorKey] = useState<ColorKey>('department');
  const [courseDetails, setCourseDetails] = useState<Record<string, Course>>({});

  // Update GlobalSearchLayout with current courses
  useEffect(() => {
    const courses = planState.semesters.flatMap(sem => sem.courses);
    window.postMessage({ type: 'PLAN_COURSES_UPDATE', courses }, '*');
  }, [planState.semesters]);

  // Custom hook to handle plan message events
  usePlanMessageHandlers(planState, setPlanState);

  const updateLock = getUpdateLockHandler(planState, setPlanState);
  const previewCourse = getPreviewCourseHandler();

  return (
    <PlanDisplay
      plan={planState}
      courseDetails={courseDetails}
      colorKey={colorKey}
      onUpdateLock={updateLock}
      onPreviewCourse={previewCourse}
    />
  );
}
