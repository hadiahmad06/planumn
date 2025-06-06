"use client";

import { Droppable } from "@hello-pangea/dnd";
import { Box, Flex, Text, Title, Skeleton, Button, Menu, Portal, Stack, Space, Container, Group } from '@mantine/core';
import { FiSave, FiShare } from "react-icons/fi";
import CourseCard from "../molecules/CourseCard";
import { ColorKey, Course, CourseDetails, Plan, Semester } from "@/types/plan";
import { useContext, useEffect, useState } from "react";
import { fetchCourseDetails, updateLock, previewCourse } from "@/types/planHandlers";
import theme from "@/styles/theme";
import { DisplaySettingsContext } from "@/contexts/DisplaySettingsContext";
import { PlanContext } from "@/contexts/PlanContext";
import SearchLayout from "@/components/organisms/SearchLayout";

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

// Margins
const HEADING_MARGIN = 4;
const MAJOR_TEXT_MARGIN = 6;
const SEMESTER_TITLE_MARGIN = 1;


export default function PlanDisplay() {
  const { plan, setPlan, cachedCourses, setCachedCourses} = useContext(PlanContext);
  if (!plan) {
    return <Skeleton height="100%" />; // Handle loading state
  }

  const { colorKey } = useContext(DisplaySettingsContext);

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

          const courseData = JSON.parse(event.data.result.draggableId) as CourseDetails;

          const details = cachedCourses;
          details[courseData.id] = courseData;
          setCachedCourses(details);

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
    <Group
      w="100vw"
      h="100vh"
      justify="space-between"
      align="stretch"
      grow
    >
      <Container
        w="50vw"
      >
        <SearchLayout />
      </Container>
      <Container
        fluid
        style={{
          marginTop:"4rem",
        }}
      >
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

      <Flex direction="column" gap={theme.planDisplayStyles.container.gap}>
        {(() => {
          const seasonLabels = { '9': 'Fall', '3': 'Spring', '5': 'Summer' };
          const seasonOrder = ['Fall', 'Spring', 'Summer'];
          const groupedByYear: Record<string, Record<string, Semester>> = {};

          plan.semesters.forEach((sem) => {
            const seasonCode = sem.index[3];
            const season = seasonLabels[seasonCode as keyof typeof seasonLabels];
            let year = sem.index.slice(0, 3); // e.g., '122' for 2022
            if (season === 'Fall') {
              const centuryDigit = parseInt(year[0], 10);
              const decade = parseInt(year.slice(1), 10);
              const fullYear = (centuryDigit + 1) * 100 + decade + 1; // shift Fall to next year
              const newCentury = Math.floor(fullYear / 100) - 1;
              const newDecade = fullYear % 100;
              year = `${newCentury}${String(newDecade).padStart(2, '0')}`;
            }

            if (season && year) {
              if (!groupedByYear[year]) groupedByYear[year] = {};
              groupedByYear[year][season] = sem;
            }
          });

          return (
            <Flex direction="column" gap={theme.planDisplayStyles.container.gap}>
              {Object.entries(groupedByYear).sort(([a], [b]) => a.localeCompare(b)).map(([year, semGroup]) => {
                // Determine max credits for row
                const maxCredits = Math.max(
                  ...seasonOrder.map((season) => {
                    const sem = semGroup[season];
                    return sem ? Math.max(
                      ALWAYS_VISIBLE_CREDITS,
                      sem.courses.reduce((sum, c) => {
                        const key = c.id;
                        return sum + (cachedCourses[key]?.cred_min || 0);
                      }, 0)
                    ) : 0;
                  })
                );

                return (
                  <Flex key={year} gap={theme.planDisplayStyles.container.gap} justify="center">
                    {seasonOrder.map((season) => {
                      const sem = semGroup[season];
                      if (!sem) {
                        return <Box key={`${year}-${season}`} style={{ width: SEMESTER_BOX_WIDTH }} />;
                      }

                      return (
                        <Droppable droppableId={String(sem.index)} key={sem.index}>
                          {(provided) => (
                            <Box
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              style={{
                                background: 'linear-gradient(135deg, rgba(249, 245, 255, 0.8), rgba(245, 245, 255, 0.6))',
                                border: '1px solid rgba(128, 128, 128, 0.2)',
                                borderRadius: '1rem',
                                padding: 12,
                                width: SEMESTER_BOX_WIDTH,
                                minHeight: SEMESTER_BOX_MIN_HEIGHT,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                              }}
                            >
                              <Text style={{ fontSize: SEMESTER_TITLE_SIZE, fontWeight: SEMESTER_TITLE_WEIGHT, marginBottom: SEMESTER_TITLE_MARGIN }}>
                                {season} 20{sem.index.slice(1, 3)}
                              </Text>
                              <Flex style={{ width: '100%', gap: CREDIT_LINE_GAP }}>
                                <Flex direction="column" align="flex-end" style={{ paddingRight: CREDIT_NUMBER_PADDING }}>
                                  {Array.from({ length: maxCredits }).map((_, i) => (
                                    <Text
                                      key={i}
                                      style={{ fontSize: '10px', color: 'rgba(0, 0, 0, 0.35)', height: CREDIT_LINE_HEIGHT }}
                                    >
                                      {i + 1}
                                    </Text>
                                  ))}
                                </Flex>
                                <Flex direction="column" gap={COURSE_VERTICAL_GAP} style={{ width: '100%', alignItems: 'center' }}>
                                  {sem.courses.map((course, j) => {
                                    const key = course.id;
                                    const details = cachedCourses[key];
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
                );
              })}
            </Flex>
          );
        })()}
      </Flex>
    </Box>

      </Container>
    </Group>
  );
}