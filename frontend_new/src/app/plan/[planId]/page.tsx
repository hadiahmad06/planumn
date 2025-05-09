"use client";

import { notFound } from "next/navigation";
import { Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useState, useEffect } from "react";
// import { getCourseColor } from "@/lib/colors";
import SettingsPanel from "@/components/SettingsPanel";
import CourseCard from "@/components/CourseCard";
import SearchBar from "@/components/SearchBar";
import CourseCardPreview from "@/components/CourseCardPreview";
import { NextResponse } from "next/server";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { Box, Flex, Text, VStack, Heading } from "@chakra-ui/react";
import GlobalSearchLayout from "@/components/GlobalSearchLayout";

// temporary in-memory fake plan data
const mockPlans: Record<string, any> = {
  "abc123": {
    createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    major: ["Computer Science B.S."],
    semesters: [
      {
        index: "1179", // Fall 2017
        courses: [
          { subject: "WRIT", number: "1301" },
          { subject: "MATH", number: "1271" },
        ],
      },
      {
        index: "1183", // Spring 2018
        courses: [
          { subject: "CSCI", number: "1133" },
          { subject: "MATH", number: "1272" },
        ],
      },
      {
        index: "1185", // Summer 2018
        courses: [
          { subject: "CSCI", number: "2041" },
          { subject: "MATH", number: "2243" },
        ],
      },
      {
        index: "1199", // Fall 2019
        courses: [
          { subject: "CSCI", number: "4061" },
          { subject: "STAT", number: "3021" },
        ],
      },
      {
        index: "1203", // Spring 2020
        courses: [
          { subject: "CSCI", number: "4041" },
        ],
      },
      {
        index: "1205", // Summer 2020
        courses: [
          { subject: "CSCI", number: "5461" },
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
  const [previewCourse, setPreviewCourse] = useState<{
    subject: string;
    number: string;
    title: string;
    credits: number;
    lock?: string;
  } | null>(null);
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
            lock: "autofilled"
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

  return (
    <Box bg="white" h="100%" p={8}>
      <Box textAlign="right">
        <Heading size="2xl" mb={4}>Your Graduation Plan</Heading>
        <Text mb={6} color="gray.500">Major: {plan.major.join(", ")}</Text>
      </Box>

      <Flex direction="column" gap={8}>
        {(() => {
          const sortedSemesters = [...planState.semesters].sort((a, b) => a.index.localeCompare(b.index));
          const rows: any[][] = [];
          let currentRow: any[] = [];
          
          sortedSemesters.forEach(sem => {
            currentRow.push(sem);
            if (sem.index.endsWith('5')) {
              rows.push(currentRow);
              currentRow = [];
            }
          });
          
          if (currentRow.length > 0) {
            rows.push(currentRow);
          }

          return rows.map((row, rowIndex) => (
            <Flex key={rowIndex} gap={6} justify="flex-end">
              {row.map((sem) => {
                const season = sem.index.endsWith('9') ? 'Fall' : 
                             sem.index.endsWith('3') ? 'Spring' : 'Summer';
                return (
                  <Droppable droppableId={String(planState.semesters.indexOf(sem))} key={sem.index}>
                    {(provided) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        bg="white"
                        border="1px"
                        borderColor="gray.200"
                        borderRadius="lg"
                        p={3}
                        w="160px"
                        minH="160px"
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                      >
                        <Text fontSize="18px" fontWeight="medium" mb={1}>
                          {season} 20{sem.index.slice(1, 3)}
                        </Text>
                        <Flex w="full" gap={2}>
                          <Flex direction="column" alignItems="flex-end" pr={1}>
                            <Text fontSize="xs" color="gray.500">
                              {[...Array(sem?.courses?.reduce((sum: number, c: any) => {
                                const key = `${c.subject}-${c.number}`;
                                return sum + (courseDetails[key]?.credits || 0);
                              }, 0) || 0)].map((_, i) => (
                                <Box key={i} h="20px">{i + 1}</Box>
                              ))}
                            </Text>
                          </Flex>
                          <Flex direction="column" gap={2} w="full" alignItems="center">
                            {sem?.courses?.map((course: { subject: string; number: string }, j: number) => {
                              const key = `${course.subject}-${course.number}`;
                              const fullCourse = courseDetails[key] || course;
                              return (
                                <CourseCard
                                  key={`${sem.index}-${j}`}
                                  course={fullCourse}
                                  index={j}
                                  semName={sem.index}
                                  updateLock={() => {
                                    const updated = [...planState.semesters];
                                    const semIdx = updated.findIndex(s => s.index === sem.index);
                                    const courseIdx = updated[semIdx].courses.findIndex((c: { subject: string; number: string }) =>
                                      c.subject === course.subject &&
                                      c.number === course.number
                                    );
                                    const currentLock = updated[semIdx].courses[courseIdx].lock;
                                    updated[semIdx].courses[courseIdx].lock =
                                      currentLock === "locked" ? "unlocked" : "locked";
                                    setPlanState({ ...planState, semesters: updated });
                                  }}
                                  colorByDepartment={colorByDepartment}
                                  colorByLevel={colorByLevel}
                                  fixedWidth={true}
                                />
                              );
                            })}
                            {provided.placeholder}
                          </Flex>
                        </Flex>
                      </Box>
                    )}
                  </Droppable>
                );
              })}
            </Flex>
          ));
        })()}
      </Flex>
    </Box>
  );
}