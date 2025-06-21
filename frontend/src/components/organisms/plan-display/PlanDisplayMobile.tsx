"use client";

import { useContext, useState, useEffect } from "react";
import { Carousel } from "@mantine/carousel";
import { Box, Flex, Text, Skeleton, Title } from "@mantine/core";
import { Droppable } from "@hello-pangea/dnd";
import { PlanContext } from "@/contexts/PlanContext";
import CourseCard from "../../molecules/CourseCard";
import { Semester } from "@/types/plan";
import classes from './PlanDisplayMobile.module.css';

type SlideItem =
  | { type: 'edge'; position: 'left' | 'right' }
  | { type: 'semester'; sem: Semester; idx: number };

export default function PlanDisplayMobile() {
  const { plan, cachedCourses } = useContext(PlanContext);
  const [initialSlide, setInitialSlide] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (!plan) return

    const now = new Date();
    const month = now.getMonth() + 1; // JS months are 0-based
    const year = now.getFullYear();

    const getSeasonCode = (month: number) => {
      if (month >= 1 && month <= 5) return "3"; // Spring
      if (month >= 6 && month <= 8) return "6"; // Summer
      return "9"; // Fall
    };

    const currentSeason = getSeasonCode(month);
    const currentYearShort = String(year).slice(-2); // "25"
    const currentIndex = `1${currentYearShort}${currentSeason}`; // e.g., "1259"

    const targetIdx = plan.semesters.findIndex(s => s.index >= currentIndex);
    setActiveSlide(targetIdx === -1 ? 0 : targetIdx);
    setInitialSlide(targetIdx === -1 ? 0 : targetIdx);
  }, [plan]);

  if (!plan) {
    return <Skeleton height="100%" />;
  }

  const slideItems : SlideItem[] = [
    // { type: 'edge', position: 'left' as const },
    ...plan.semesters.map((sem, idx) => ({ type: 'semester' as const, sem, idx })),
    // { type: 'edge', position: 'right' as const },
  ] ;

  return (
    <Box className={classes.carouselContainer}>
      <Carousel
        slideGap={0}
        slideSize="80%"
        withControls={true}
        emblaOptions={{
            loop: false,
            align: 'center'
        }}
        height="100%"
        classNames={classes}
        styles={{ 
            viewport: { overflow: 'hidden' },
        }}
        onSlideChange={setActiveSlide}
        initialSlide={initialSlide}
      >
        {(() => {
          return slideItems.map((item, idx) => {
            if (item.type === 'edge') {
              return (
                <Carousel.Slide key={`edge-${item.position}`}>
                    <Box
                        className={classes.edgeWrapper}
                        style={{
                          justifyContent: item.position === 'left' ? 'flex-end' : 'flex-start',
                        }}
                    >
                    <Box
                        className={classes.edgeCard}
                        style={{
                            transform: activeSlide === idx ? "scale(0.95)" : "scale(0.85)",
                            border: activeSlide === idx ? '1px solid #811331' : '0px solid #811331',
                        }}
                    >
                        + -
                    </Box>
                  </Box>
                </Carousel.Slide>
              );
            }

            const sem = item.sem;
            const totalCredits = sem.courses.reduce(
              (sum, c) => sum + (cachedCourses[c.id]?.cred_min || 0),
              0
            );
            const seasonCode = sem.index[3];
            const seasonLabel =
              seasonCode === "9"
                ? "🍂 Fall"
                : seasonCode === "3"
                ? "🌱 Spring"
                : "☀️ Summer";
            const yearNum = parseInt("20" + sem.index.slice(1, 3), 10);

            return (
              <Carousel.Slide key={sem.index}>
                <Box
                  className={classes.semesterCard}
                  style={{
                    transform: activeSlide === idx ? "scale(0.95)" : "scale(0.85)",
                    border: activeSlide === idx ? '1px solid #811331' : '0px solid #811331',
                  }}
                >
                  <Title order={3} mb="md">
                    {seasonLabel} {seasonLabel === "🍂 Fall" ? yearNum : yearNum + 1}
                  </Title>
                  <Text color="dimmed" mb="md" size="md">
                    {totalCredits} credits
                  </Text>
                  <Flex
                      className={classes.courseWrapper}
                  >
                      {sem.courses.map((course, j) => {
                      const details = cachedCourses[course.id];
                      return (
                        <Flex key={`${sem.index}-${j}`} align="start" style={{ width: '100%' }}>
                          {/* CourseCard with fixed size */}
                          <Box style={{ flex: '0 0 auto' }}>
                            <CourseCard
                              courseId={course.id}
                              index={j}
                              semName={sem.index}
                              isDraggable={false}
                              showPreview={false}
                              fixedWidth
                              fontSize="1rem"
                              source="plan"
                            />
                          </Box>
                          {/* Details box takes remaining space */}
                          {details && (
                            <Box
                              ml="sm"
                              style={{
                                flex: '1 1 0',
                                minWidth: 0,
                                textAlign: 'right',
                              }}
                            >
                              <Text size="xs" color="dimmed">
                                {details.class_desc}
                              </Text>
                              {/* <Text size="xs" color="dimmed">
                                {details.campus}
                              </Text> */}
                            </Box>
                          )}
                        </Flex>
                      );
                      })}
                  </Flex>
                </Box>
              </Carousel.Slide>
            );
          });
        })()}
      </Carousel>
      <Flex className={classes.bubbleWrapper}>
        {slideItems.map((_, i) => (
          <Box
            key={i}
            className={`${classes.bubble} ${activeSlide === i ? classes.activeBubble : ''}`}
          />
        ))}
      </Flex>
    </Box>
  );
}