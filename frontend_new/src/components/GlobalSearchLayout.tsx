"use client";

import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { Box, Flex, VStack, Heading, Text } from "@chakra-ui/react";
import SearchBar from "./SearchBar";
import SettingsPanel from "./SettingsPanel";
import CoursePreviewPanel from "./CoursePreviewPanel";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ColorKey } from "@/types/plan"; // Added import for ColorKey

interface GlobalSearchLayoutProps {
  children: React.ReactNode;
}

// Layout
const CONTAINER_PADDING = 4;
const CONTENT_GAP = 4;
const SEARCH_MARGIN = 4;

// Typography
const HEADING_SIZE = "lg";
const RESULT_TEXT_SIZE = "sm";

// Colors
const CONTAINER_BG = "white";
const CONTAINER_BORDER = "gray.200";

export default function GlobalSearchLayout({ children }: GlobalSearchLayoutProps) {
  const [colorKey, setColorKey] = useState<ColorKey>('department'); // Updated to use ColorKey
  const [previewCourse, setPreviewCourse] = useState<any>(null);
  const [currentPlanCourses, setCurrentPlanCourses] = useState<any[]>([]);
  const pathname = usePathname();

  // Listen for messages from the plan page
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'PLAN_COURSES_UPDATE') {
        setCurrentPlanCourses(event.data.courses);
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
    if (pathname.startsWith('/plan/')) {
      window.postMessage({ type: 'DRAG_END', result }, '*');
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Flex minH="100vh" bg="white">
        {/* Left side - Search Bar */}
        <Box w="1/2" borderRight="1px" borderColor="gray.200" bg="white" position="relative">
          <Droppable droppableId="search">
            {(provided) => (
              <Box 
                ref={provided.innerRef} 
                {...provided.droppableProps}
                h="100%"
                p={CONTAINER_PADDING}
                display="flex"
                flexDirection="column"
                bg={CONTAINER_BG}
                border="1px"
                borderColor={CONTAINER_BORDER}
                borderRadius="lg"
              >
                <Box flex="1" display="flex" flexDirection="column">
                  <Heading size={HEADING_SIZE}>Search Courses</Heading>
                  <Box mb={SEARCH_MARGIN}>
                    <SearchBar 
                      colorKey={colorKey} // Updated to pass colorKey
                      onPreviewCourse={setPreviewCourse}
                      currentPlanCourses={currentPlanCourses}
                    />
                  </Box>
                  <Box mt={4}>
                    <SettingsPanel
                      colorKey={colorKey} // Updated to pass colorKey
                      setColorKey={setColorKey} // Updated to pass setColorKey
                      onAutofill={() => {
                        // Forward autofill event to plan page if we're on a plan page
                        if (pathname.startsWith('/plan/')) {
                          window.postMessage({ type: 'AUTOFILL' }, '*');
                        }
                      }}
                    />
                  </Box>
                </Box>
                {provided.placeholder}
              </Box>
            )}
          </Droppable>
          <Box position="absolute" top="70vh" left={8} right={8}>
            <CoursePreviewPanel course={previewCourse} />
          </Box>
        </Box>

        {/* Right side - Content */}
        <Box w="1/2" overflowY="auto" bg="white">
          {children}
        </Box>
      </Flex>
    </DragDropContext>
  );
}