"use client";

import { Droppable } from "@hello-pangea/dnd";
import { Box, Flex, Text, Heading } from "@chakra-ui/react";
import CourseCard from "./CourseCard";
import { ColorKey, Course, Plan, Semester } from "@/types/plan";
import { useEffect, useState } from "react";
import { usePlanMessageHandlers, getCourseDetails, updateLock, previewCourse } from "@/handlers/planHandlers";

const ALWAYS_VISIBLE_CREDITS = 4;
const COURSE_VERTICAL_GAP = 0;

// Layout
const CONTAINER_PADDING = 8;
const ROW_GAP = 8;
const SEMESTER_GAP = 6;
const CREDIT_LINE_GAP = 2;
const SEMESTER_BOX_PADDING = 3;
const CREDIT_NUMBER_PADDING = 1;

// Dimensions
const SEMESTER_BOX_WIDTH = "160px";
const SEMESTER_BOX_MIN_HEIGHT = "160px";
const CREDIT_LINE_HEIGHT = "20px";

// Typography
const HEADING_SIZE = "2xl";
const SEMESTER_TITLE_SIZE = "18px";
const CREDIT_NUMBER_SIZE = "xs";
const SEMESTER_TITLE_WEIGHT = "medium";

// Colors
const SEMESTER_BOX_BG = "gray.50";
const SEMESTER_BOX_BORDER = "gray.200";
const SECONDARY_TEXT_COLOR = "gray.500";

// Margins
const HEADING_MARGIN = 4;
const MAJOR_TEXT_MARGIN = 6;
const SEMESTER_TITLE_MARGIN = 1;

interface PlanDisplayProps {
  plan: Plan;
  setPlan: (plan: Plan) => void;
  // courseDetails: Record<string, Course>;
  // colorKey: ColorKey
  // onUpdateLock: (semIndex: string, course: Course) => void;
  // onPreviewCourse: (course: CourseCardCourse | null) => void;
}

export default function PlanDisplay({
  plan,
  setPlan,
  // onUpdateLock,
  // onPreviewCourse,
}: PlanDisplayProps) {

  const [colorKey, setColorKey] = useState<ColorKey>('department');
  const [courseDetails, setCourseDetails] = useState<Record<string, Course>>({});

  useEffect(() => {
    // Fetch the initial colorKey value from GlobalSearchLayout
    const fetchInitialColorKey = () => {
      const initialColorKey = window.localStorage.getItem('colorKey'); // Assuming GlobalSearchLayout stores it in localStorage
      if (initialColorKey) {
        setColorKey(initialColorKey as ColorKey);
      }
    };

    fetchInitialColorKey();
    usePlanMessageHandlers(plan, setPlan); // Custom hook to handle plan updates

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'COLOR_KEY_UPDATE') {
        setColorKey(event.data.colorKey as ColorKey); // Update colorKey based on the message
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []); // Add listener for colorKey updates and fetch initial value

  useEffect(() => {
    const fetchCourseDetails = async () => {
      const details: Record<string, any> = {};
      for (const semester of plan.semesters) {
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
  }, [plan]);

  // Update GlobalSearchLayout with current courses
  useEffect(() => {
    const courses = plan.semesters.flatMap((sem: { courses: any[] }) => sem.courses);
    window.postMessage({ type: 'PLAN_COURSES_UPDATE', courses }, '*');
  }, [plan.semesters]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'DRAG_END') {
        const { source, destination } = event.data.result;
        if (!destination) return;

        const updated = [...plan.semesters];

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

        setPlan({ ...plan, semesters: updated });
      } else if (event.data.type === 'AUTOFILL') {
        const updated = [...plan.semesters];
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
        setPlan({ ...plan, semesters: updated });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [plan]);

  return (
    <Box bg="white" h="100%" p={CONTAINER_PADDING} position="relative">
      <Box textAlign="right">
        <Heading size={HEADING_SIZE} mb={HEADING_MARGIN}>Your Graduation Plan</Heading>
        <Text mb={MAJOR_TEXT_MARGIN} color={SECONDARY_TEXT_COLOR}>Major: {plan.major.join(", ")}</Text>
      </Box>

      <Flex direction="column" gap={ROW_GAP}>
        {(() => {
          const sortedSemesters = [...plan.semesters].sort((a, b) => a.index.localeCompare(b.index));
          const rows: Semester[][] = [];
          let currentRow: Semester[] = [];
          
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
            <Flex key={rowIndex} gap={SEMESTER_GAP} justify="flex-end">
              {row.map((sem) => {
                const season = sem.index.endsWith('9') ? 'Fall' : 
                             sem.index.endsWith('3') ? 'Spring' : 
                             sem.index.endsWith('5') ? 'Summer' : 'Unknown';
                return (
                  <Droppable droppableId={String(plan.semesters.indexOf(sem))} key={sem.index}>
                    {(provided) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        bg={SEMESTER_BOX_BG}
                        border="1px"
                        borderColor={SEMESTER_BOX_BORDER}
                        borderRadius="lg"
                        p={SEMESTER_BOX_PADDING}
                        w={SEMESTER_BOX_WIDTH}
                        minH={SEMESTER_BOX_MIN_HEIGHT}
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                      >
                        <Text fontSize={SEMESTER_TITLE_SIZE} fontWeight={SEMESTER_TITLE_WEIGHT} mb={SEMESTER_TITLE_MARGIN}>
                          {season} 20{sem.index.slice(1, 3)}
                        </Text>
                        <Flex w="full" gap={CREDIT_LINE_GAP}>
                          <Flex direction="column" alignItems="flex-end" pr={CREDIT_NUMBER_PADDING}>
                            {[...Array(Math.max(
                              ALWAYS_VISIBLE_CREDITS,
                              sem?.courses?.reduce((sum: number, c: Course) => {
                                const key = `${c.subject}-${c.number}`;
                                return sum + (courseDetails[key]?.credits || 0);
                              }, 0) || 0
                            ))].map((_, i) => (
                              <Text key={i} fontSize={CREDIT_NUMBER_SIZE} color={SECONDARY_TEXT_COLOR} h={CREDIT_LINE_HEIGHT}>
                                {i + 1}
                              </Text>
                            ))}
                          </Flex>
                          <Flex direction="column" gap={COURSE_VERTICAL_GAP} w="full" alignItems="center">
                            {sem?.courses?.map((course: Course, j: number) => {
                              const key = `${course.subject}-${course.number}`;
                              const fullCourse = courseDetails[key] || course;
                              return (
                                <CourseCard
                                  key={`${sem.index}-${j}`}
                                  course={fullCourse}
                                  index={j}
                                  semName={sem.index}
                                  updateLock={() => updateLock(plan, setPlan)(sem.index, course)}
                                  colorKey={colorKey}
                                  fixedWidth={true}
                                  fontSize={'15px'}
                                  onPreviewCourse={previewCourse}
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