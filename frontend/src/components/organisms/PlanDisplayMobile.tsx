"use client";

import { useContext, useState } from "react";
import { Carousel } from "@mantine/carousel";
import { Box, Flex, Text, Skeleton, Title } from "@mantine/core";
import { Droppable } from "@hello-pangea/dnd";
import { PlanContext } from "@/contexts/PlanContext";
import CourseCard from "../molecules/CourseCard";

export default function PlanDisplayMobile() {
  const { plan, cachedCourses } = useContext(PlanContext);
  const [activeSlide, setActiveSlide] = useState(0);

  if (!plan) {
    return <Skeleton height="100%" />;
  }

  return (
    <Box 
        style={{ 
            marginTop: "4rem", 
            width: '100dvw', 
            height: '50dvh',
        }}
    >
      <Carousel
        slideGap={0}
        slideSize="100%"
        withControls={true}
        emblaOptions={{
            loop: false,
            align: 'center'
        }}
        height="100%"
        styles={{ 
            viewport: { overflow: 'hidden' },
            control: {
                '&[data-inactive]': {
                opacity: 0,
                cursor: 'default',
                },
            },
        }}
        onSlideChange={setActiveSlide}
      >
        {plan.semesters.map((sem, idx) => {
          const totalCredits = sem.courses.reduce(
            (sum, c) => sum + (cachedCourses[c.id]?.cred_min || 0),
            0
          );
          // derive season/year label
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
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transform: activeSlide === idx ? "scale(0.95)" : "scale(0.85)",
                  transition: "transform 0.3s ease, border 0.3s ease",
                  padding: '1.5rem',
                  background: "rgba(255,255,255,0.5)",
                  boxShadow: '0 0 0 4px rgba(209, 99, 145, 0.25), 0 6px 18px rgba(0, 0, 0, 0.1)',
                  border: activeSlide === idx ? '1px solid #811331' : '0px solid #811331',
                  borderRadius: '1rem',
                }}
              >
                <Title order={3} mb="md">
                  {seasonLabel} {seasonLabel === "🍂 Fall" ? yearNum : yearNum + 1}
                </Title>
                <Text color="dimmed" mb="md" size="md">
                  {totalCredits} credits
                </Text>
                <Flex
                    direction="column"
                    gap="0.3rem"
                    style={{ justifyContent: 'center', alignItems: 'center' }}
                >
                    {sem.courses.map((course, j) => {
                    const details = cachedCourses[course.id] 
                    // if (details) {
                    return (
                        <Flex key={`${sem.index}-${j}`} align="center" justify="space-between" style={{ width: '100%' }}>
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

                            {details &&
                            <Box ml="sm" style={{ textAlign: 'right' }}>
                                <Text size="xs" color="dimmed">
                                {details.cred_min}-{details.cred_max} credits
                                </Text>
                                <Text size="xs" color="dimmed">
                                {details.campus}
                                </Text>
                            </Box>
                            }
                        </Flex>
                    );
                    // }
                    })}
                </Flex>
              </Box>
            </Carousel.Slide>
          );
        })}
      </Carousel>
      <Flex justify="center" mt="md" gap="xs">
        {plan.semesters.map((_, i) => (
          <Box
            key={i}
            style={{
              width: activeSlide === i ? '1rem' : '0.5rem',
              height: '0.5rem',
              borderRadius: '1rem',
              backgroundColor: activeSlide === i ? '#811331' : '#ccc',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </Flex>
    </Box>
  );
}