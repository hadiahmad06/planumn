"use client";

import { useState, useEffect } from "react";
import SettingsPanel from "@/components/SettingsPanel";
import SearchBar from "@/components/SearchBar";
import CoursePreviewPanel from "@/components/CoursePreviewPanel";
import { Box, Flex, Text, VStack, Heading } from "@chakra-ui/react";
import GlobalSearchLayout from "@/components/GlobalSearchLayout";
import PlanDisplay from "@/components/PlanDisplay";
import { Course, CourseCardCourse, Plan, Semester } from "@/types/plan";
import { handleUpdateLock, handlePreviewCourse } from "@/handlers/planHandlers";

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
  const [colorByDepartment, setColorByDepartment] = useState(true);
  const [colorByLevel, setColorByLevel] = useState(false);
  const [courseDetails, setCourseDetails] = useState<Record<string, Course>>({});

  // Update GlobalSearchLayout with current courses
  useEffect(() => {
    const courses = planState.semesters.flatMap(sem => sem.courses);
    window.postMessage({ type: 'PLAN_COURSES_UPDATE', courses }, '*');
  }, [planState.semesters]);

  // Listen for messages from GlobalSearchLayout
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

  const updateLock = handleUpdateLock(planState, setPlanState);
  const previewCourse = handlePreviewCourse();

  return (
    <PlanDisplay
      plan={planState}
      courseDetails={courseDetails}
      colorByDepartment={colorByDepartment}
      colorByLevel={colorByLevel}
      onUpdateLock={updateLock}
      onPreviewCourse={previewCourse}
    />
  );
}
