"use client";

import { Box, Container, Flex, Group, Stack, Title } from '@mantine/core';
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { ColorKey, Course, CourseDetails } from '@/types/plan';
import SearchBar from '@/components/molecules/SearchBar';
import CoursePreviewPanel from '@/components/organisms/CoursePreviewPanel';
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import AnimatedTypingText from '../atoms/landing/AnimatedTypingTest';

export default function SearchLayout() {
  const pathname = usePathname();

  return (
    <Stack
      justify="space-between"
      align="stretch"
    >
      <Droppable droppableId="search">
        {(provided) => (
          <Box
            ref={provided.innerRef}
            style={{
            }}
          >
            <Title
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "#0f172a",
              marginBottom: "0.5rem",
            }}
            >
              <AnimatedTypingText blink={false}/>
            </Title>
            <SearchBar/>
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </Stack>
  );
}