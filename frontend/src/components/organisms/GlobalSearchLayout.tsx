"use client";

import { Box, Container, Flex, Group, Stack, Title } from '@mantine/core';
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { ColorKey, Course, CourseDetails } from '@/types/plan';
import SearchBar from '@/components/molecules/SearchBar';
import SettingsPanel from '@/components/molecules/SettingsPanel';
import CoursePreviewPanel from '@/components/organisms/CoursePreviewPanel';
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import AnimatedTypingText from '../atoms/AnimatedTypingTest';

interface GlobalSearchLayoutProps {
  children: React.ReactNode;
}

// Layout
const CONTAINER_PADDING = 12;
const CONTENT_GAP = 4;
const SEARCH_MARGIN = 4;

// Typography
const HEADING_SIZE = "lg";
const RESULT_TEXT_SIZE = "sm";

// Colors
const CONTAINER_BG = "white";
const CONTAINER_BORDER = "gray.200";

export default function GlobalSearchLayout({ children }: GlobalSearchLayoutProps) {
  const [colorKey, setColorKey] = useState<ColorKey>('department');
  const [previewCourse, setPreviewCourse] = useState<CourseDetails | null>(null);
  const [currentPlanCourses, setCurrentPlanCourses] = useState<number[]>([]);
  const pathname = usePathname();

  // Listen for messages from the plan page
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'PLAN_COURSES_UPDATE') {
        setCurrentPlanCourses(event.data.courseIds);
      } else if (event.data.type === 'PREVIEW_COURSE') {
        setPreviewCourse(event.data.course);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    // Load initial colorKey from localStorage
    const storedColorKey = window.localStorage.getItem('colorKey');
    if (storedColorKey) {
      setColorKey(storedColorKey as ColorKey);
    }
  }, []);

  useEffect(() => {
    // Save colorKey to localStorage whenever it changes
    window.localStorage.setItem('colorKey', colorKey);
    // Notify PlanDisplay of colorKey changes
    window.postMessage({ type: 'COLOR_KEY_UPDATE', colorKey }, '*');
  }, [colorKey]); // Trigger effect whenever colorKey changes

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    // Forward the drag end event to the plan page if we're on a plan page
    if (pathname.startsWith('/plan')) {
      window.postMessage({ type: 'DRAG_END', result }, '*');
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Group
        w="100vw"
        h="100vh"
        justify="space-between"
        align="stretch"
        grow
        // gap={CONTENT_GAP}
        // p={CONTAINER_PADDING}
        // h="400"
        // style={{
        //   minHeight: '100vh',
        //   backgroundColor: CONTAINER_BG,
        //   border: `1px solid ${CONTAINER_BORDER}`,
        //   position: 'relative',
        // }}
      // style={{ minHeight: '100vh', backgroundColor: 'white' }}
      >
        {/* Left side - Search Bar */}
        <Container
          w="50vw"
          fluid
        >
          <Stack
          justify="space-between"
          align="stretch"
          // style={{
          //   width: '50%',
          //   borderRight: '1px solid gray',
          //   backgroundColor: 'white',
          //   position: 'relative',
          // }}
          >
            <Droppable droppableId="search">
              {(provided) => (
                <Box
                  ref={provided.innerRef}
                  style={{
                  }}
                >
                  {/* <Box style={{ flex: 1, display: 'flex', flexDirection: 'column' }}> */}
                    <Title
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      color: "#0f172a",
                      marginBottom: "0.5rem",
                    }}
                    >
                      <AnimatedTypingText/>
                    </Title>
                    {/* <Title order={2} style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>PlanUMN</Title> */}
                    {/* <Box style={{ marginBottom: '1rem' }}> */}
                      <SearchBar
                        colorKey={colorKey}
                        onPreviewCourse={setPreviewCourse}
                        currentPlanCourses={currentPlanCourses}
                      />
                    {/* </Box> */}
                    {/* <Box style={{ marginTop: '1rem' }}> */}
                      <SettingsPanel
                        colorKey={colorKey}
                        setColorKey={setColorKey}
                        onAutofill={() => {
                          if (pathname.startsWith('/plan/')) {
                            window.postMessage({ type: 'AUTOFILL' }, '*');
                          }
                        }}
                      />
                    {/* </Box> */}
                  {/* </Box> */}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
            <Box 
            // style={{ position: 'absolute', top: '70vh', left: '2rem', right: '2rem' }}
            >
              <CoursePreviewPanel course={previewCourse} />
            </Box>
          </Stack>
        </Container>

        {/* Right side - Content */}
        <Container
          fluid
          style={{ 
            marginTop: "4rem",
            marginBottom: "4rem"
          }}
          >
          {/* <Stack 
          justify="flex-start"
          align="stretch"
          
          > */}
            {children}
          {/* </Stack> */}
        </Container>
      </Group>
    </DragDropContext>
  );
}