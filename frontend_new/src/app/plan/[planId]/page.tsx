"use client";

import { notFound } from "next/navigation";
import { useState, useEffect } from "react";
import SettingsPanel from "@/components/SettingsPanel";
import SearchBar from "@/components/SearchBar";
import CoursePreviewPanel from "@/components/CoursePreviewPanel";
import { Box, Flex, Text, VStack, Heading } from "@chakra-ui/react";
import GlobalSearchLayout from "@/components/GlobalSearchLayout";
import PlanDisplay from "@/components/PlanDisplay";
import { Course, CourseCardCourse, Plan, Semester } from "@/types/plan";
import { handleUpdateLock, handlePreviewCourse } from "@/handlers/planHandlers";

// temporary in-memory fake plan data
const mockPlans: Record<string, any> = {
  "abc123": {
    createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    major: ["Computer Science B.S."],
    semesters: [
      {
        index: "1249", // Fall 2024
        courses: [
          { subject: "WRIT", number: "1301" },
          { subject: "MATH", number: "1271" },
        ],
      },
      {
        index: "1253", // Spring 2025
        courses: [
          { subject: "CSCI", number: "1133" },
          { subject: "MATH", number: "1272" },
        ],
      },
      {
        index: "1255", // Summer 2025
        courses: [
          { subject: "CSCI", number: "1133" },
          { subject: "MATH", number: "1272" },
        ],
      },
      {
        index: "1259", // Fall 2026
        courses: [
          { subject: "WRIT", number: "1301" },
          { subject: "MATH", number: "1271" },
        ],
      },
      {
        index: "1263", // Spring 2026
        courses: [
          { subject: "CSCI", number: "1133" },
          { subject: "MATH", number: "1272" },
        ],
      },
      {
        index: "1265", // Summer 2026
        courses: [
          { subject: "CSCI", number: "2041" },
          { subject: "MATH", number: "2243" },
        ],
      },
      {
        index: "1269", // Fall 2026
        courses: [
          { subject: "CSCI", number: "4061" },
          { subject: "STAT", number: "3021" },
        ],
      },
      {
        index: "1273", // Spring 2027
        courses: [
          { subject: "CSCI", number: "4041" },
        ],
      },
      {
        index: "1275", // Summer 2027
        courses: [
          { subject: "CSCI", number: "5461" },
        ],
      },
      {
        index: "1279", // Fall 2027
        courses: [
          { subject: "CSCI", number: "4041" },
        ],
      },
      {
        index: "1283", // Spring 2028
        courses: [
          { subject: "CSCI", number: "5461" },
        ],
      },
      {
        index: "1285", // Summer 2028
        courses: [
          { subject: "CSCI", number: "4041" },
        ],
      },
    ],
  },
};

async function getCourseDetails(subject: string, number: string) {
  const response = await fetch(`/api/courses?subject=${subject}&number=${number}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch course details: ${response.statusText}`);
  }
  return response.json();
}

export default function PlanPage({ params }: { params: { planId: string } }) {
  const plan = mockPlans[params.planId];

  if (!plan) return notFound();

  const expired = Date.now() - plan.createdAt.getTime() > 1000 * 60 * 60 * 48;
  if (expired) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" textAlign="center" p={8}>
        <Box>
          <Heading size="2xl" mb={2}>Plan Expired</Heading>
          <Text color="gray.500">This graduation plan is no longer available. Create a new one to get started.</Text>
        </Box>
      </Box>
    );
  }

  const [planState, setPlanState] = useState(plan);
  const [colorByDepartment, setColorByDepartment] = useState(true);
  const [colorByLevel, setColorByLevel] = useState(false);
  const [courseDetails, setCourseDetails] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchCourseDetails = async () => {
      const details: Record<string, any> = {};
      for (const semester of planState.semesters) {
        for (const course of semester.courses) {
          const key = `${course.subject}-${course.number}`;
          if (!details[key]) {
            try {
              const courseInfo = await getCourseDetails(course.subject, course.number);
              if (courseInfo) {
                details[key] = {
                  ...course,
                  title: courseInfo.title,
                  credits: courseInfo.credits,
                  lock: course.lock || "unlocked"
                };
              }
            } catch (error) {
              console.error(`Error fetching details for ${course.subject} ${course.number}:`, error);
              // Fall back to basic course info if fetch fails
              details[key] = {
                ...course,
                title: `${course.subject} ${course.number}`,
                credits: 0,
                lock: course.lock || "unlocked"
              };
            }
          }
        }
      }
      setCourseDetails(details);
    };

    fetchCourseDetails();
  }, [planState]);

  // Update GlobalSearchLayout with current courses
  useEffect(() => {
    const courses = planState.semesters.flatMap((sem: { courses: any[] }) => sem.courses);
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
          const courseData = JSON.parse(event.data.result.draggableId);
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