"use client";

import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { Box, Flex, VStack } from "@chakra-ui/react";
import SearchBar from "./SearchBar";
import SettingsPanel from "./SettingsPanel";
import CoursePreviewPanel from "./CoursePreviewPanel";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface GlobalSearchLayoutProps {
  children: React.ReactNode;
}

export default function GlobalSearchLayout({ children }: GlobalSearchLayoutProps) {
  const [colorByDepartment, setColorByDepartment] = useState(true);
  const [colorByLevel, setColorByLevel] = useState(false);
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
                p={8}
                display="flex"
                flexDirection="column"
              >
                <Box flex="1" display="flex" flexDirection="column">
                  <SearchBar 
                    colorByDepartment={colorByDepartment}
                    colorByLevel={colorByLevel}
                    onPreviewCourse={setPreviewCourse}
                    currentPlanCourses={currentPlanCourses}
                  />
                  <Box mt={4}>
                    <SettingsPanel
                      colorByDepartment={colorByDepartment}
                      colorByLevel={colorByLevel}
                      setColorByDepartment={setColorByDepartment}
                      setColorByLevel={setColorByLevel}
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