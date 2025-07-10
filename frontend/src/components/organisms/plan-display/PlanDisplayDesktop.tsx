"use client";

import { Box, Skeleton, Group, ActionIcon } from '@mantine/core';
import SemesterScrollArea from "@/components/organisms/plan-display/Desktop-Semesters/SemesterScrollArea";
import ManipulateYear from "@/utils/PlanDisplayUtils/ManipulateYear";
import { CourseMetadata, QueriedCourse } from "@/types/plan";
import { useContext, useEffect } from "react";
import { PlanContext } from "@/contexts/data/PlanContext";
import SearchLayout from "@/components/organisms/SearchLayout";
import PlanHeader from "../../atoms/PlanHeader";
import { IconMinus, IconPlus } from "@tabler/icons-react";
import { MobileContext } from "@/contexts/visual/MobileContext";
import PlanDisplayMobile from "./PlanDisplayMobile";
import diddy from '../plan-display/Styles/PlanDisplayDesktop.module.css'

// export default function PlanDisplay() {
//   const { isMobile } = useContext(MobileContext);
//   return isMobile ? <PlanDisplayMobile/> : <PlanDisplayDesktop/>;
// }

export default function PlanDisplayDesktop() {
  const { plan, setPlan, cachedCourses } = useContext(PlanContext);

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

          const courseData = JSON.parse(event.data.result.draggableId) as QueriedCourse

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
    <Group className={diddy.background}>
      <Box
        w="60%"
      >
        <SearchLayout />
      </Box>
        <Box className={diddy.planLayout}>
          <PlanHeader/>
          <Box className={diddy.semesterContainer}>
            <SemesterScrollArea/>
            <Box className={diddy.leftButtons}
            >
              <ActionIcon 
                bg='rgba(129, 19, 49, 0.1)' 
                radius='md'  
                onClick={() => {ManipulateYear(plan, setPlan, "AddPrecedingYear")}}
              >
                <IconPlus color={'Green'}/>
              </ActionIcon>
              <ActionIcon  
                bg='rgba(129, 19, 49, 0.1)'
                radius='md'
                onClick={() => {ManipulateYear(plan, setPlan,"RemovePrecedingYear")}}
              >
                <IconMinus color={'Red'}/>
              </ActionIcon>
            </Box>
            <Box className={diddy.rightButtons}>
              <ActionIcon 
                bg='rgba(129, 19, 49, 0.1)'
                radius='md'
                onClick={() => {ManipulateYear(plan, setPlan, "AddLatestYear")}}
              >
                <IconPlus color={'Green'}/>
              </ActionIcon>

              <ActionIcon 
                bg='rgba(129, 19, 49, 0.1)'  
                radius='md'
                onClick={() => {ManipulateYear(plan, setPlan, "RemoveLatestYear")}}
              >
                <IconMinus color={'Red'}/>
              </ActionIcon>
            </Box>
          </Box>
        </Box>
    </Group>
  );
}