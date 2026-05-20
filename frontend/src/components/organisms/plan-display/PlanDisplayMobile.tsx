"use client";

import { useContext } from "react";
import { Box, Flex, ScrollArea, Skeleton, Stack, Text } from "@mantine/core";
import { PlanContext } from "@/contexts/data/PlanContext";
import {
  DisplaySettingsContext,
  isSemesterHidden,
} from "@/contexts/visual/DisplaySettingsContext";
import CourseCard from "@/components/molecules/CourseCard";
import AdvisorChat from "@/components/organisms/AdvisorChat";
import MobileAddPicker from "@/components/molecules/MobileAddPicker";
import MobileRailSection from "./MobileRailSection";
import TopBar from "./TopBar";
import classes from "./PlanDisplayMobile.module.css";

function semesterLabel(index: string): string {
  const yy = parseInt(index.slice(1, 3), 10);
  const season = index[3];
  if (season === "9") return `Fall ${2000 + yy}`;
  if (season === "3") return `Spring ${2000 + yy - 1}`;
  if (season === "5") return `Summer ${2000 + yy - 1}`;
  return index;
}

export default function PlanDisplayMobile() {
  const { plan, cachedCourses } = useContext(PlanContext);
  const { hiddenSemesters } = useContext(DisplaySettingsContext);

  if (!plan) {
    return (
      <Box style={{ width: "100vw", height: "100vh", background: "var(--bg-canvas)" }}>
        <TopBar />
        <Box p="md">
          <Skeleton height="80vh" />
        </Box>
      </Box>
    );
  }

  const visibleSemesters = [...plan.semesters]
    .filter(
      (sem) => !isSemesterHidden(sem.index, hiddenSemesters) && !!sem.index[3]
    )
    .sort((a, b) => a.index.localeCompare(b.index));

  return (
    <Box
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-canvas)",
        overflow: "hidden",
      }}
    >
      <TopBar />

      <ScrollArea style={{ flex: 1 }} type="scroll" scrollbars="y">
        <Stack gap="md" p="md">
          <MobileRailSection />

          {visibleSemesters.map((sem) => {
            const creditTotal = sem.courses.reduce(
              (sum, c) => sum + (cachedCourses[c.id]?.cred_min || 0),
              0
            );

            return (
              <Box key={sem.index} className={classes.semesterCard}>
                <Flex justify="space-between" align="center" className={classes.semesterHeader}>
                  <Text className={classes.semesterTitle}>
                    {semesterLabel(sem.index)}
                  </Text>
                  <Text className={classes.semesterCredits}>{creditTotal} cr</Text>
                </Flex>

                <Stack gap={6} className={classes.dropZone}>
                  {sem.courses.length === 0 ? (
                    <Text className={classes.emptyHint}>
                      No courses yet. Tap a requirement above to add one.
                    </Text>
                  ) : (
                    sem.courses.map((course, j) => (
                      <CourseCard
                        key={`${sem.index}-${j}`}
                        courseId={course.id}
                        index={j}
                        semName={sem.index}
                        isDraggable={false}
                        showPreview
                        fontSize="14px"
                        source="plan"
                      />
                    ))
                  )}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </ScrollArea>

      <MobileAddPicker />
      <AdvisorChat />
    </Box>
  );
}
