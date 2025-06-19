"use client";

import { Droppable } from "@hello-pangea/dnd";
import { Box, Flex, Text, Title, Skeleton, Button, Menu, Portal, Stack, Space, Accordion, ScrollArea, Container, Group } from '@mantine/core';
// Accordion control open/closed styles
// You may move these to a CSS module or stylesheet if preferred
const SEMESTER_BACKGROUND = 'linear-gradient(135deg, rgba(221, 208, 208, 0.8), rgba(245, 245, 255, 0.6))';

import { FiSave, FiShare } from "react-icons/fi";
import CourseCard from "../molecules/CourseCard";
import { ColorKey, Course, CourseDetails, CourseMetadata, Plan, QueriedCourse, Semester } from "@/types/plan";
import { useContext, useEffect, useState } from "react";
import { updateLock } from "@/types/planHandlers";
import theme from "@/styles/theme";
import { DisplaySettingsContext } from "@/contexts/DisplaySettingsContext";
import { PlanContext } from "@/contexts/PlanContext";
import SearchLayout from "@/components/organisms/SearchLayout";
import CoursePreviewPanel from "./CoursePreviewPanel";
import PlanHeader from "../atoms/PlanHeader";

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
const SEMESTER_BOX_WIDTH = "150px";
const SEMESTER_BOX_MIN_HEIGHT = "90px";
const CREDIT_LINE_HEIGHT = "20px";

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

// Margins
const HEADING_MARGIN = 4;
const MAJOR_TEXT_MARGIN = 6;
const SEMESTER_TITLE_MARGIN = 1;


export default function PlanDisplay() {
  const { plan, setPlan, cachedCourses } = useContext(PlanContext);

  // Accordion control open/closed state for bottom border radius
  const [closedAccordion, setClosedAccordion] = useState<string[]>([]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (!plan) return;
      // setClosedAccordion([]);
      if (event.data.type === 'DRAG_END') {
        console.log("Received drag end event:", event.data.result);
        const { source, destination } = event.data.result;
        if (!destination) return;

        const updated = [...plan.semesters];

        const destSem = updated.find(sem => sem.index === destination.droppableId);
        if (!destSem) return;
        const courses: CourseMetadata[] = destSem.courses;
        if (source.droppableId === "search") {

          const courseData = JSON.parse(event.data.result.draggableId) as QueriedCourse;

          // const details = cachedCourses;
          // details[courseData.id] = courseData;
          // setCachedCourses(details);

          courses.splice(destination.index, 0, {
            ...courseData,
            lock: "unlocked"
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
  }, [plan, setPlan]);


  if (!plan) {
    return <Skeleton height="100%" />; // Handle loading state
  }
  
  return (
    <Group
      w="100vw"
      h="100vh"
      justify="space-between"
      align="stretch"
      wrap="nowrap"
      grow
      style={{padding:"16px"}}
    >
      <Box
        w="40%"
      >
        <SearchLayout />
      </Box>
      <Box
        w="60%"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {/* CENTERED SEMESTER CONTAINER */}
        <Box
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '4em',
            paddingBottom: '2rem',
          }}
        >
          <PlanHeader/>
          <Box
          style={{
            width: '100%',
            maxWidth: '1200px',
            background: 'rgba(129, 19, 49, 0.1)',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          }}
          >
            <ScrollArea
              style={{
                height: 'calc(100vh - 20rem)', // adjust to leave space for headers
                overflow: 'auto',
              }}
              type="scroll"
              scrollbars="y"
              offsetScrollbars
              scrollHideDelay={0}
            >
              <Flex
              direction="row"
              align="flex-start"
              justify="center"
              gap={theme.planDisplayStyles.container.gap}
              wrap="wrap"
              >
                {(() => {
                  // Group semesters by year, only Fall and Spring
                  const groupedByAcademicYear: Record<string, { Fall?: Semester; Spring?: Semester; Summer?: Semester }> = {};
                  const seasonLabels: Record<string, string> = { '9': 'Fall', '3': 'Spring', '5': 'Summer' };
                  
                  // Accordion control open/closed state for bottom border radius

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
                          <Flex
                            key={year}
                            direction="column"
                            align="center"
                            gap={theme.planDisplayStyles.container.gap + 10}
                            style={{ width: '150px' }}
                          >
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
                                  sem.courses.reduce((sum, c) => sum + (cachedCourses[c.id]?.cred_min || 0), 0)
                                );
                                return (
                                    <Accordion
                                      multiple
                                      value={plan.semesters.map(sem => sem.index).filter(index => !closedAccordion.includes(index))}
                                      onChange={(newValues) => {
                                        const allIndices = plan.semesters.map(sem => sem.index);
                                        const newlyClosed = allIndices.filter(index => !newValues.includes(index));
                                        setClosedAccordion(newlyClosed);
                                      }}
                                      key={`${year}-${season}`}
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
                                          borderBottomLeftRadius: !closedAccordion.includes(sem.index) ? '0' : '1rem',
                                          borderBottomRightRadius: !closedAccordion.includes(sem.index) ? '0' : '1rem',
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
                                                <Flex direction="column" align="flex-end" >
                                                  {Array.from({ length: totalCredits }).map((_, i) => (
                                                    <Text
                                                      key={i}
                                                      style={{
                                                        fontSize: '10px',
                                                        color: 'rgba(0, 0, 0, 0.35)',
                                                        height: CREDIT_LINE_HEIGHT,
                                                        lineHeight: CREDIT_LINE_HEIGHT,
                                                        textAlign: 'left',
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
                                                  {(sem.courses as CourseMetadata[]).map((course, j) => {
                                                    return <CourseCard
                                                      key={`${sem.index}-${j}`}
                                                      courseId={course.id}
                                                      index={j}
                                                      semName={sem.index}
                                                      updateLock={() => updateLock(sem.index, j)}
                                                      fixedWidth
                                                      fontSize="15px"
                                                      source="plan"/>
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
            </ScrollArea>
          </Box>
        </Box>
      </Box>
    </Group>
  );
}