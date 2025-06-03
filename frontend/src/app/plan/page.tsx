"use client";

import { useState, useEffect } from "react";
import SettingsPanel from "@/components/molecules/SettingsPanel";
import SearchBar from "@/components/molecules/SearchBar";
import CoursePreviewPanel from "@/components/organisms/CoursePreviewPanel";
import { Box, Flex, Text, Stack, Title } from '@mantine/core';
import GlobalSearchLayout from "@/components/organisms/GlobalSearchLayout";
import PlanDisplay from "@/components/organisms/PlanDisplay";
import { Course, CourseDetails, Plan, PlanDetails, Semester, SemesterDetails } from "@/types/plan";
// import { handleUpdateLock, handlePreviewCourse } from "@/handlers/planHandlers";

// Create a new empty plan
const createEmptyPlan = (): PlanDetails => {
  const currentYear = new Date().getFullYear();
  const semesters: SemesterDetails[] = [];
  
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
  
  console.log("Created empty plan with semesters:", semesters);
  return {
    id: "new-plan",
    user_id: null,
    createdAt: new Date(),
    major: ["Computer Science B.S."],
    semesters: semesters
  };
};

export default function NewPlanPage() {
  const [planState, setPlanState] = useState<PlanDetails>(createEmptyPlan());

  return (
    <PlanDisplay
      plan={planState}
      setPlan={setPlanState}
    />
  );
}
