"use client";

import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { Box, Flex, VStack, Heading, Text } from "@chakra-ui/react";
import SearchBar from "../molecules/SearchBar";
import SettingsPanel from "../molecules/SettingsPanel";
import CoursePreviewPanel from "./CoursePreviewPanel";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ColorKey, Course, CourseDetails } from "@/types/plan"; // Added import for ColorKey
import theme from "@/styles/theme";

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
  const [colorKey, setColorKey] = useState<ColorKey>('department'); // Updated to use ColorKey
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
    if (pathname.startsWith('/plan/')) {
      window.postMessage({ type: 'DRAG_END', result }, '*');
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Flex minH="100vh" bg={theme.globalSearchLayoutStyles.container.bg /* "white" */}>
        {/* Left side - Search Bar */}
        <Box
          w="1/2"
          borderRight="1px"
          borderColor={theme.globalSearchLayoutStyles.container.borderColor /* "gray.200" */}
          bg={theme.globalSearchLayoutStyles.container.bg /* "white" */}
          position="relative"
        >
          <Droppable droppableId="search">
            {(provided) => (
              <Box
                ref={provided.innerRef}
                {...provided.droppableProps}
                h="100%"
                p={theme.globalSearchLayoutStyles.container.padding /* 12 */}
                display="flex"
                flexDirection="column"
                bg={theme.globalSearchLayoutStyles.container.bg /* "white" */}
                border="1px"
                borderColor={theme.globalSearchLayoutStyles.container.borderColor /* "gray.200" */}
                borderRadius={theme.globalSearchLayoutStyles.container.borderRadius /* "lg" */}
              >
                <Box flex="1" display="flex" flexDirection="column">
                  <Heading size={theme.globalSearchLayoutStyles.heading.size as "lg" /* "lg" */}>PlanUMN</Heading>
                  <Box mb={theme.globalSearchLayoutStyles.searchMargin /* 4 */}>
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
        <Box w="1/2" overflowY="auto" bg={theme.globalSearchLayoutStyles.container.bg /* "white" */}>
          {children}
        </Box>
      </Flex>
    </DragDropContext>
  );
}