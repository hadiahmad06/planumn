"use client";

import { Droppable } from "@hello-pangea/dnd";
import { Box, Flex, Text, Title, Skeleton, Button, Menu, Portal } from '@mantine/core';
import { FiShare } from "react-icons/fi";
import CourseCard from "../molecules/CourseCard";
import { ColorKey, Course, CourseDetails, PlanDetails, Semester } from "@/types/plan";
import { useEffect, useState } from "react";
import { fetchCourseDetails, updateLock, previewCourse } from "@/types/planHandlers";
import theme from "@/styles/theme";

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
  plan: PlanDetails;
  setPlan: (plan: PlanDetails) => void;
}

export default function PlanDisplay({
  plan,
  setPlan,
}: PlanDisplayProps) {
  const [colorKey, setColorKey] = useState<ColorKey>('department');
  const [courseDetails, setCourseDetails] = useState<Record<number, CourseDetails>>({});

  useEffect(() => {
    // Fetch the initial colorKey value from GlobalSearchLayout
    const fetchInitialColorKey = () => {
      const initialColorKey = window.localStorage.getItem('colorKey'); // Assuming GlobalSearchLayout stores it in localStorage
      if (initialColorKey) {
        setColorKey(initialColorKey as ColorKey);
      }
    };

    fetchInitialColorKey();
    fetchCourseDetails(courseDetails, setCourseDetails, plan);

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'COLOR_KEY_UPDATE') {
        setColorKey(event.data.colorKey as ColorKey); // Update colorKey based on the message
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []); // Add listener for colorKey updates and fetch initial value

  // Update GlobalSearchLayout with current courses
  useEffect(() => {
    const courseIds = plan.semesters.flatMap((sem: { courses: CourseDetails[] }) => sem.courses.map(course => course.id));
    window.postMessage({ type: 'PLAN_COURSES_UPDATE', courseIds }, '*');
  }, [plan.semesters]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data.type === 'DRAG_END') {
        console.log("Received drag end event:", event.data.result);
        const { source, destination } = event.data.result;
        if (!destination) return;

        const updated = [...plan.semesters];

        const destSem = updated.find(sem => sem.index === destination.droppableId);
        if (!destSem) return;
        const courses: Course[] = destSem.courses;
        if (source.droppableId === "search") {
          // console.log("Adding course from search:", event.data.result.draggableId);
          // const courseId = event.data.result.draggableId as number;
          const courseData = JSON.parse(event.data.result.draggableId) as CourseDetails;
          // console.log("Fetched course data:", courseData);
          const details = courseDetails;
          details[courseData.id] = courseData;
          setCourseDetails(details);

          courses.splice(destination.index, 0, {
            ...courseData,
            lock: courseData.lock || "unlocked"
          });

        } else {
          const sourceSem = updated.find(sem => sem.index === source.droppableId);
          if (!sourceSem) return;
          const [moved] = sourceSem.courses.splice(source.index, 1);
          courses.splice(destination.index, 0, moved);
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
    <Box style={{ background: theme.planDisplayStyles.container.bg, height: '100%', padding: theme.planDisplayStyles.container.padding, position: 'relative' }}>
      <Flex style={{ marginY: '10', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Menu>
            <Menu.Target>
              <Button aria-label="Share Plan" variant="filled">
                <FiShare style={{ marginRight: '0.5rem' }} /> Share
              </Button>
            </Menu.Target>
            <Portal>
              <Menu.Dropdown>
                <Menu.Item>Share Link</Menu.Item>
                <Menu.Item>Copy Plan</Menu.Item>
              </Menu.Dropdown>
            </Portal>
          </Menu>
        </Box>
        <Box>
          <Title order={2} style={{ marginBottom: theme.planDisplayStyles.heading.margin }}>Your Graduation Plan</Title>
          <Text style={{ marginBottom: theme.planDisplayStyles.majorText.margin, color: theme.planDisplayStyles.majorText.color }}>Major: {plan.major.join(', ')}</Text>
        </Box>
      </Flex>

      <Flex direction="column" gap={theme.planDisplayStyles.container.gap}>
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
            <Flex key={rowIndex} gap={theme.planDisplayStyles.container.gap} justify="flex-end">
              {row.map((sem) => {
                const season = sem.index.endsWith('9') ? 'Fall' : 
                             sem.index.endsWith('3') ? 'Spring' : 
                             sem.index.endsWith('5') ? 'Summer' : 'Unknown';
                return (
                  <Droppable droppableId={String(sem.index)} key={sem.index}>
                    {(provided) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{
                          background: SEMESTER_BOX_BG,
                          border: '1px solid',
                          borderColor: SEMESTER_BOX_BORDER,
                          borderRadius: 'lg',
                          padding: SEMESTER_BOX_PADDING,
                          width: SEMESTER_BOX_WIDTH,
                          minHeight: SEMESTER_BOX_MIN_HEIGHT,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontSize: SEMESTER_TITLE_SIZE, fontWeight: SEMESTER_TITLE_WEIGHT, marginBottom: SEMESTER_TITLE_MARGIN }}>
                          {season} 20{sem.index.slice(1, 3)}
                        </Text>
                        <Flex style={{ width: '100%', gap: CREDIT_LINE_GAP }}>
                          <Flex direction="column" align="flex-end" style={{ paddingRight: CREDIT_NUMBER_PADDING }}>
                            {Array.from({
                              length: Math.max(
                                ALWAYS_VISIBLE_CREDITS,
                                sem?.courses?.reduce((sum, c) => {
                                  const key = c.id;
                                  return sum + (courseDetails[key]?.cred_min || 0);
                                }, 0) || 0
                              ),
                            }).map((_, i) => (
                              <Text
                                key={i}
                                style={{ fontSize: CREDIT_NUMBER_SIZE, color: SECONDARY_TEXT_COLOR, height: CREDIT_LINE_HEIGHT }}
                              >
                                {i + 1}
                              </Text>
                            ))}
                          </Flex>
                          <Flex direction="column" gap={COURSE_VERTICAL_GAP} style={{ width: '100%', alignItems: 'center' }}>
                            {sem?.courses?.map((course, j) => {
                              const key = course.id;
                              const details = courseDetails[key];
                              return details ? (
                                <CourseCard
                                  key={`${sem.index}-${j}`}
                                  course={details}
                                  index={j}
                                  semName={sem.index}
                                  updateLock={() => updateLock(plan, setPlan)(sem.index, details)}
                                  colorKey={colorKey}
                                  fixedWidth
                                  fontSize="15px"
                                  onPreviewCourse={previewCourse}
                                />
                              ) : (
                                <Skeleton key={`${sem.index}-${j}`} height="40px" width="100%" />
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