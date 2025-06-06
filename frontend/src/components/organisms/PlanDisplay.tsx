"use client";

import { Droppable } from "@hello-pangea/dnd";
import { Box, Flex, Text, Title, Skeleton, Button, Menu, Portal, Stack, Space, Accordion } from '@mantine/core';
// Accordion control open/closed styles
// You may move these to a CSS module or stylesheet if preferred
const SEMESTER_BACKGROUND = 'linear-gradient(135deg, rgba(221, 208, 208, 0.8), rgba(245, 245, 255, 0.6))';

import { FiSave, FiShare } from "react-icons/fi";
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
const CREDIT_NUMBER_PADDING = 0;

// Dimensions
const SEMESTER_BOX_WIDTH = "160px";
const SEMESTER_BOX_MIN_HEIGHT = "100px";
const CREDIT_LINE_HEIGHT = "20px";  // 20px

// Accordion control open/closed styles
const accordionControlStyles = {
  open: {
    fontWeight: 700,
  },
  closed: {
    fontWeight: 500,
  }
};

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
      <Flex justify="flex-end">
        <Button.Group>
          <Button 
            variant="default" 
            leftSection={<FiShare />}
          >
            Copy Link
          </Button>
          <Button 
            variant="gradient" 
            leftSection={<FiSave />}
            gradient={{ from: "#C15D8E", to: "#E78AB4", deg: 0 }}
          >
            Save
          </Button>
        </Button.Group>
      </Flex>
      <Space h="lg"/>
      <Flex justify="flex-end" align="flex-start" mb="lg" gap="sm">
        

        <Stack gap={1} style={{ textAlign: 'right' }}>
          <Title
            order={2}
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#2D2A32',
            }}
          >
            Your Graduation Plan
          </Title>
          <Text
            style={{
              fontSize: '15px',
              color: '#6C6F85',
            }}
          >
            Major: {plan.major.join(', ') || "Unknown"}
          </Text>
        </Stack>
      </Flex>

      <Flex
        direction="row"
        gap={theme.planDisplayStyles.container.gap}
        justify="flex-end"
        style={{ position: 'absolute', top: 100, right: 32, zIndex: 1 }}
      >
        {(() => {
          // Group semesters by year, only Fall and Spring
          const groupedByAcademicYear: Record<string, { Fall?: Semester; Spring?: Semester; Summer?: Semester }> = {};
          const seasonLabels: Record<string, string> = { '9': 'Fall', '3': 'Spring', '5': 'Summer' };
          
          // Accordion control open/closed state for bottom border radius
          const [openAccordion, setOpenAccordion] = useState<string[]>(() =>
            plan.semesters.map((sem) => sem.index)
          );

          plan.semesters.forEach((sem) => {
            const seasonCode = sem.index[3];
            const season = seasonLabels[seasonCode];
            if (!season) return;
            let year = parseInt('20' + sem.index.slice(1, 3), 10);
            // For Spring and Summer, assign to previous year
            if (season === 'Spring' || season === 'Summer') year -= 1;
            const yearStr = year.toString();
            if (!groupedByAcademicYear[yearStr]) groupedByAcademicYear[yearStr] = {};
            (groupedByAcademicYear[yearStr] as any)[season] = sem;
          });

          return (
            <>
              {Object.entries(groupedByAcademicYear)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([year, semGroupRaw]) => {
                  const semGroup = semGroupRaw as Record<'Fall' | 'Spring' | 'Summer', Semester | undefined>;
                  return (
                    <Flex key={year} direction="column" gap={theme.planDisplayStyles.container.gap + 10}>
                      <Title>
                        {/* {year}–{(parseInt(year) + 1).toString().slice(-2)} */}
                      </Title>
                      {(() => {
                        const { Fall, Spring, Summer } = semGroup as { Fall?: Semester; Spring?: Semester; Summer?: Semester };
                        return (['🍂 Fall', '🌱 Spring', '☀️ Summer'] as const).map((season) => {
                          const sem = season === '🍂 Fall' ? Fall : season === '🌱 Spring' ? Spring : Summer;
                          if (!sem) {
                            return <Box key={`${year}-${season}`} style={{ width: SEMESTER_BOX_WIDTH, minHeight: SEMESTER_BOX_MIN_HEIGHT }} />;
                          }
                          const totalCredits = Math.max(
                            ALWAYS_VISIBLE_CREDITS,
                            sem.courses.reduce((sum, c) => sum + (courseDetails[c.id]?.cred_min || 0), 0)
                          );
                          return (
                              <Accordion
                                multiple
                                value={openAccordion}
                                onChange={setOpenAccordion}
                                style={{
                                  width: '100%',
                                  background: 'transparent',
                                  boxShadow: 'none',
                                  padding: 0,
                                  display: 'flex',
                                  flexDirection: 'column',
                                }}
                                styles={{
                                  content: { margin: 0, padding: 0 },
                                  item: {
                                    border: 'none',
                                    margin: 0,
                                    padding: 0,
                                    borderBottomLeftRadius: '1rem',
                                    borderBottomRightRadius: '1rem',
                                  },
                                  control: {
                                    textAlign: 'center',
                                    fontSize: SEMESTER_TITLE_SIZE,
                                    color: '#2D2A32',
                                    background: SEMESTER_BACKGROUND,
                                    border: '1px solid rgba(128, 128, 128, 0.2)',
                                    padding: 12,
                                    width: '100%',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                                    display: 'block',
                                    marginBottom: 0,
                                    paddingBottom: 12,
                                    borderTopLeftRadius: '1rem',
                                    borderTopRightRadius: '1rem',
                                    borderBottomLeftRadius: openAccordion.includes(sem.index) ? '0' : '1rem',
                                    borderBottomRightRadius: openAccordion.includes(sem.index) ? '0' : '1rem',
                                  },
                                  panel: { 
                                    padding: 0, 
                                    margin: 0,
                                    background: 'transparent',
                                    boxShadow: 'none',
                                    border: 'none',
                                    display: 'block',
                                    borderBottomLeftRadius: '1rem',
                                    borderBottomRightRadius: '1rem',
                                  },
                                  chevron: { display: 'none' }
                                }}
                              >
                              <Accordion.Item value={sem.index} key={sem.index}>
                                <Accordion.Control>
                                  <Text>
                                    {season} {season === '🍂 Fall' ? year : parseInt(year) + 1}
                                  </Text>
                                </Accordion.Control>
                                <Accordion.Panel>
                                  <Droppable droppableId={String(sem.index)} key={sem.index}>
                                    {(provided) => (
                                      <Box
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        style={{
                                          background: SEMESTER_BACKGROUND,
                                          borderLeft: '1px solid rgba(128, 128, 128, 0.2)',
                                          borderRight: '1px solid rgba(128, 128, 128, 0.2)',
                                          borderBottom: '1px solid rgba(128, 128, 128, 0.2)',
                                          borderTop: 'none',
                                          borderTopLeftRadius: 0,
                                          borderTopRightRadius: 0,
                                          borderBottomLeftRadius: '1rem',
                                          borderBottomRightRadius: '1rem',
                                          padding: 12,
                                          width: SEMESTER_BOX_WIDTH,
                                          minHeight: SEMESTER_BOX_MIN_HEIGHT,
                                          display: 'flex',
                                          flexDirection: 'column',
                                          alignItems: 'center',
                                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                                          marginTop: '0px'
                                        }}
                                      >
                                        <Flex style={{ width: '100%', gap: CREDIT_LINE_GAP }}>
                                          <Flex direction="column" align="flex-end" style={{ paddingRight: CREDIT_NUMBER_PADDING, minWidth: '2ch' }}>
                                            {Array.from({ length: totalCredits }).map((_, i) => (
                                              <Text
                                                key={i}
                                                style={{
                                                  fontSize: '10px',
                                                  color: 'rgba(0, 0, 0, 0.35)',
                                                  height: CREDIT_LINE_HEIGHT,
                                                  lineHeight: CREDIT_LINE_HEIGHT,
                                                  textAlign: 'right',
                                                  width: '100%',
                                                  letterSpacing: 0,
                                                  minWidth: '2ch',
                                                }}
                                              >
                                                {i + 1}
                                              </Text>
                                            ))}
                                          </Flex>
                                          <Flex direction="column" gap={COURSE_VERTICAL_GAP} style={{ width: '100%', alignItems: 'center' }}>
                                            {(sem.courses as CourseDetails[]).map((course, j) => {
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
                                </Accordion.Panel>
                              </Accordion.Item>
                            </Accordion>
                          );
                        });
                      })()}
                    </Flex>
                  );
                })}
            </>
          );
        })()}
      </Flex>
    </Box>
  );
}