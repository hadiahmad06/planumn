"use client";

import { Droppable } from "@hello-pangea/dnd";
import { Box, Flex, Text, Title, Skeleton, Button, Menu, Portal, Stack, Space, Accordion, ScrollArea, Container, Group, ActionIcon, Tooltip } from '@mantine/core';
import { MenuItem } from "@/components/atoms/ContextMenu";
import { notifications } from "@mantine/notifications";
import { IconCopy, IconExternalLink, IconTrash, IconArrowUp, IconArrowDown } from "@tabler/icons-react";
import {
  getSameSeasonPreviousYear,
  getSameSeasonNextYear,
  getSeasonInAcademicYear,
  deleteCourseFromSemester,
  moveCourseBetweenSemesters,
  ensureSemesterExists,
  Season,
} from "@/lib/semesterUtils";
// Accordion control open/closed styles
// You may move these to a CSS module or stylesheet if preferred
const SEMESTER_BACKGROUND = 'linear-gradient(135deg, rgba(221, 208, 208, 0.8), rgba(245, 245, 255, 0.6))';

import ManipulateYear from "@/lib/ManipulateYear";
import CourseCard from "../../molecules/CourseCard";
import { ColorKey, Course, CourseDetails, CourseMetadata, Plan, QueriedCourse, Semester } from "@/types/plan";
import { useContext, useEffect, useState } from "react";
import theme from "@/styles/theme";
import { PlanContext } from "@/contexts/data/PlanContext";
import SearchLayout from "@/components/organisms/SearchLayout";
import PlanHeader from "../../atoms/PlanHeader";
import { IconMinus, IconPlus, IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { MobileContext } from "@/contexts/visual/MobileContext";
import PlanDisplayMobile from "./PlanDisplayMobile";

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
  const { isMobile } = useContext(MobileContext);
  return isMobile ? <PlanDisplayMobile/> : <PlanDisplayDesktop/>;
}

export function PlanDisplayDesktop() {
  const { plan, setPlan, cachedCourses } = useContext(PlanContext);

  // Accordion control open/closed state for bottom border radius
  const [closedAccordion, setClosedAccordion] = useState<string[]>([]);

// Semester selection state
  const [selectedSemesters, setSelectedSemesters] = useState<Set<string>>(new Set());

  // Toggle semester selection
  const toggleSemesterSelection = (semesterIndex: string) => {
    setSelectedSemesters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(semesterIndex)) {
        newSet.delete(semesterIndex);
      } else {
        newSet.add(semesterIndex);
      }
      return newSet;
    });
  };

  // Year-level collapse state
  const [collapsedYears, setCollapsedYears] = useState<Set<string>>(new Set());

  // Toggle all semesters in a year
  const toggleYearCollapse = (year: string, yearSemesters: Semester[]) => {
    const yearSemesterIndices = yearSemesters.map(s => s.index);
    const isYearCollapsed = yearSemesterIndices.every(idx => closedAccordion.includes(idx));

    if (isYearCollapsed) {
      // Expand year: remove semester indices from closedAccordion, remove year from collapsedYears
      setClosedAccordion(prev => prev.filter(idx => !yearSemesterIndices.includes(idx)));
      setCollapsedYears(prev => {
        const newSet = new Set(prev);
        newSet.delete(year);
        return newSet;
      });
    } else {
      // Collapse year: add semester indices to closedAccordion, add year to collapsedYears
      setClosedAccordion(prev => {
        // Don't mutate prev, return a new array with all indices (union)
        const set = new Set(prev);
        yearSemesterIndices.forEach(idx => set.add(idx));
        return Array.from(set);
      });
      setCollapsedYears(prev => {
        const newSet = new Set(prev);
        newSet.add(year);
        return newSet;
      });
    }
  };

  const [yearManipulate, setYearManipulate] = useState<string>('')

  const handleDeleteCourse = (courseId: number, semesterIndex: string) => {
    if (!plan) return;

    const updated = deleteCourseFromSemester(plan, courseId, semesterIndex);
    if (updated !== plan) {
      setPlan(updated);
      notifications.show({
        title: "Deleted",
        message: "Course removed from plan",
        color: "green",
      });
    }
  };

  const handleMoveToSeason = (courseId: number, fromSemIndex: string, toSeason: Season) => {
    if (!plan) return;

    const toSemIndex = getSeasonInAcademicYear(fromSemIndex, toSeason);
    if (!toSemIndex) return;

    let updated = ensureSemesterExists(plan, toSemIndex);
    updated = moveCourseBetweenSemesters(updated, courseId, fromSemIndex, toSemIndex);

    if (updated !== plan) {
      setPlan(updated);
      notifications.show({
        title: "Moved",
        message: `Course moved to ${toSeason}`,
        color: "green",
      });
    }
  };

  const handleMoveToPreviousYear = (courseId: number, fromSemIndex: string) => {
    if (!plan) return;

    const toSemIndex = getSameSeasonPreviousYear(fromSemIndex);
    if (!toSemIndex) return;

    let updated = ensureSemesterExists(plan, toSemIndex);
    updated = moveCourseBetweenSemesters(updated, courseId, fromSemIndex, toSemIndex);

    if (updated !== plan) {
      setPlan(updated);
      notifications.show({
        title: "Moved",
        message: "Course moved to previous year",
        color: "green",
      });
    }
  };

  const handleMoveToNextYear = (courseId: number, fromSemIndex: string) => {
    if (!plan) return;

    const toSemIndex = getSameSeasonNextYear(fromSemIndex);
    if (!toSemIndex) return;

    let updated = ensureSemesterExists(plan, toSemIndex);
    updated = moveCourseBetweenSemesters(updated, courseId, fromSemIndex, toSemIndex);

    if (updated !== plan) {
      setPlan(updated);
      notifications.show({
        title: "Moved",
        message: "Course moved to next year",
        color: "green",
      });
    }
  };

  const handleCopyCourseCode = (course: CourseDetails) => {
    const courseCode = `${course.dept_abbr} ${course.course_num}`;
    navigator.clipboard.writeText(courseCode).then(() => {
      notifications.show({
        title: "Copied",
        message: courseCode,
        color: "green",
      });
    });
  };

  const handleOpenInCatalog = (course: CourseDetails) => {
    window.open(`https://onestop2.umn.edu/psp/ps/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES.CLASS_SEARCH.GBL?Page=CLASS_SRCH_WRK2_SSRPB_SCR_DESCR&Action=U&ACAD_YEAR=2024&STRM=1249&SUBJ=${course.dept_abbr}&CATALOG_NBR=${course.course_num}`, "_blank");
  };

  const getContextMenuItems = (course: CourseDetails, semesterIndex: string): MenuItem[] => [
    {
      label: "Delete",
      icon: <IconTrash size={16} />,
      onClick: () => handleDeleteCourse(course.id, semesterIndex),
      color: "red",
    },
    {
      label: "Move to Fall 🍂",
      icon: <IconArrowUp size={16} />,
      onClick: () => handleMoveToSeason(course.id, semesterIndex, "Fall"),
    },
    {
      label: "Move to Spring 🌱",
      icon: <IconArrowUp size={16} />,
      onClick: () => handleMoveToSeason(course.id, semesterIndex, "Spring"),
    },
    {
      label: "Move to Summer ☀️",
      icon: <IconArrowUp size={16} />,
      onClick: () => handleMoveToSeason(course.id, semesterIndex, "Summer"),
    },
    {
      label: "Move to previous year ↑",
      icon: <IconArrowUp size={16} />,
      onClick: () => handleMoveToPreviousYear(course.id, semesterIndex),
    },
    {
      label: "Move to next year ↓",
      icon: <IconArrowDown size={16} />,
      onClick: () => handleMoveToNextYear(course.id, semesterIndex),
    },
    {
      label: "Copy Course Code",
      icon: <IconCopy size={16} />,
      onClick: () => handleCopyCourseCode(course),
    },
    {
      label: "Open in Catalog",
      icon: <IconExternalLink size={16} />,
      onClick: () => handleOpenInCatalog(course),
    },
  ];

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

        } else if (source.droppableId && source.droppableId.startsWith("program-")) {

          const courseCode = event.data.result.draggableId;
          const [dept, num] = courseCode.split(" ");

          if (cachedCourses) {
            const existingCourse = Object.values(cachedCourses).find(
              c => c.dept_abbr === dept && c.course_num === num
            );

            if (existingCourse) {
              courses.splice(destination.index, 0, {
                ...existingCourse,
                lock: "unlocked"
              });
            }
          }

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
  }, [plan, setPlan, cachedCourses]);


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
            position: 'relative',
            width: '100%',
            height: '100%',
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
                  // console.log(plan.semesters)
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
                        const yearSemesters = Object.values(semGroup).filter((s): s is Semester => s !== undefined);
                        const isYearCollapsed = yearSemesters.every(s => closedAccordion.includes(s.index));

                        return (
                          <Flex
                            direction="column"
                            key={year}
                            align="flex-start"
                            gap="md"
                          >
                            <Flex
                              align="center"
                              gap="sm"
                              onClick={() => toggleYearCollapse(year, yearSemesters)}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(129, 19, 49, 0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(129, 19, 49, 0.05)';
                              }}
                              style={{
                                cursor: 'pointer',
                                padding: '0.5rem 1rem',
                                background: 'rgba(129, 19, 49, 0.05)',
                                borderRadius: '0.5rem',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <IconChevronUp
                                size={20}
                                style={{
                                  transform: isYearCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.3s ease',
                                  color: '#811331',
                                }}
                              />
                              <Text
                                fw={700}
                                size="lg"
                                style={{ color: '#2D2A32' }}
                              >
                                {year}–{(parseInt(year) + 1).toString().slice(-2)}
                              </Text>
                            </Flex>
                            <Flex
                              direction="row"
                              align="flex-start"
                              justify="flex-start"
                              gap={theme.planDisplayStyles.container.gap + 10}
                              wrap="nowrap"
                            >
                            {(() => {
                              const { Fall, Spring, Summer } = semGroup as { Fall?: Semester; Spring?: Semester; Summer?: Semester };
                              return (['🍂 Fall', '🌱 Spring', '☀️ Summer'] as const).map((season) => {
                                const sem = season === '🍂 Fall' ? Fall : season === '🌱 Spring' ? Spring : Summer;
                                if (!sem) {
                                  return;
                                  // return <Box key={`${year}-${season}`} style={{ width: SEMESTER_BOX_WIDTH, minHeight: SEMESTER_BOX_MIN_HEIGHT }} />;
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
                                           background: selectedSemesters.has(sem.index)
                                             ? 'linear-gradient(135deg, rgba(255, 235, 235, 0.9), rgba(255, 245, 245, 0.8))'
                                             : SEMESTER_BACKGROUND,
                                           border: selectedSemesters.has(sem.index)
                                             ? '2px solid #811331'
                                             : '1px solid rgba(128, 128, 128, 0.2)',
                                           padding: 12,
                                           width: SEMESTER_BOX_WIDTH,
                                           boxShadow: selectedSemesters.has(sem.index)
                                             ? '0 4px 12px rgba(129, 19, 49, 0.2)'
                                             : '0 2px 8px rgba(0, 0, 0, 0.05)',
                                           display: 'block',
                                           marginBottom: 0,
                                           paddingBottom: 12,
                                           borderTopLeftRadius: '1rem',
                                           borderTopRightRadius: '1rem',
                                           borderBottomLeftRadius: !closedAccordion.includes(sem.index) ? '0' : '1rem',
                                           borderBottomRightRadius: !closedAccordion.includes(sem.index) ? '0' : '1rem',
                                           cursor: 'pointer',
                                           transition: 'all 0.2s ease',
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
                                      <Accordion.Control onClick={(e) => {
                                        e.stopPropagation();
                                        toggleSemesterSelection(sem.index);
                                      }}>
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
                                                    const courseDetails = cachedCourses[course.id];
                                                    return (
                                                      <CourseCard
                                                        key={`${sem.index}-${j}`}
                                                        courseId={course.id}
                                                        index={j}
                                                        semName={sem.index}
                                                        fixedWidth
                                                        fontSize="15px"
                                                        source="plan"
                                                        contextMenuItems={courseDetails ? getContextMenuItems(courseDetails, sem.index) : []}
                                                      />
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
                           </Flex>
                         );
                       })}
                     </>
                   );
                 })()}
               </Flex>
</ScrollArea>
            <Box
               style={{
                 display: "flex",
                 flexDirection: 'column',
                 gap: '0.5rem',
                 position: 'absolute',
                 right: '5%',
                 top: '10%',
                 transform: 'translateY(-50%)',
               }}
             >
               <Tooltip label="Add year at start" position="left">
                 <ActionIcon
                   bg='rgba(129, 19, 49, 0.1)'
                   radius='md'
                   style={{ transition: 'all 0.2s ease' }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.background = 'rgba(129, 19, 49, 0.2)';
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.background = 'rgba(129, 19, 49, 0.1)';
                   }}
                   onClick={() => {ManipulateYear(plan, setPlan, "AddPrecedingYear")}}
                 >
                   <IconPlus color={'Green'}/>
                 </ActionIcon>
               </Tooltip>
               <Tooltip label="Remove earliest year" position="left">
                 <ActionIcon
                   bg='rgba(129, 19, 49, 0.1)'
                   radius='md'
                   style={{ transition: 'all 0.2s ease' }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.background = 'rgba(129, 19, 49, 0.2)';
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.background = 'rgba(129, 19, 49, 0.1)';
                   }}
                   onClick={() => {ManipulateYear(plan, setPlan, "RemovePrecedingYear")}}
                 >
                   <IconMinus color={'Red'}/>
                 </ActionIcon>
               </Tooltip>
             </Box>
             <Box style={{
                 display: "flex",
                 flexDirection: 'column',
                 gap: '0.5rem',
                 position: 'absolute',
                 right: '5%',
                 bottom: '10%',
                 transform: 'translateY(50%)',
               }}
             >
               <Tooltip label="Add year at end" position="left">
                 <ActionIcon
                   bg='rgba(129, 19, 49, 0.1)'
                   radius='md'
                   style={{ transition: 'all 0.2s ease' }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.background = 'rgba(129, 19, 49, 0.2)';
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.background = 'rgba(129, 19, 49, 0.1)';
                   }}
                   onClick={() => {ManipulateYear(plan, setPlan, "AddLatestYear")}}
                 >
                   <IconPlus color={'Green'}/>
                 </ActionIcon>
               </Tooltip>
               <Tooltip label="Remove latest year" position="left">
                 <ActionIcon
                   bg='rgba(129, 19, 49, 0.1)'
                   radius='md'
                   style={{ transition: 'all 0.2s ease' }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.background = 'rgba(129, 19, 49, 0.2)';
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.background = 'rgba(129, 19, 49, 0.1)';
                   }}
                   onClick={() => {ManipulateYear(plan, setPlan, "RemoveLatestYear")}}
                 >
                   <IconMinus color={'Red'}/>
                 </ActionIcon>
               </Tooltip>
             </Box>
          </Box>
        </Box>
      </Box>
    </Group>
  );
}