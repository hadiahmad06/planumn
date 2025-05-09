"use client";

import { useState } from "react";
import { DropResult } from "@hello-pangea/dnd";
import GlobalSearchLayout from "./GlobalSearchLayout";
import { Box } from "@chakra-ui/react";

export default function GlobalSearch({ children }: { children: React.ReactNode }) {
  const [colorByDepartment, setColorByDepartment] = useState(true);
  const [colorByLevel, setColorByLevel] = useState(false);
  const [previewCourse, setPreviewCourse] = useState<any>(null);
  const [currentPlanCourses, setCurrentPlanCourses] = useState<any[]>([]);

  const handleDragEnd = (result: DropResult) => {
    // Handle drag and drop at the app level
    // This will be passed down to individual pages that need it
    console.log('Drag ended:', result);
  };

  return (
    <Box minH="100vh" w="100%">
      <GlobalSearchLayout
        onDragEnd={handleDragEnd}
        colorByDepartment={colorByDepartment}
        colorByLevel={colorByLevel}
        onPreviewCourse={setPreviewCourse}
        currentPlanCourses={currentPlanCourses}
      >
        {children}
      </GlobalSearchLayout>
    </Box>
  );
} 