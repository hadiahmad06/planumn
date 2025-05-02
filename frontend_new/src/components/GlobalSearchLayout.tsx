"use client";

import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import SearchBar from "./SearchBar";
import { useState } from "react";

interface GlobalSearchLayoutProps {
  children: React.ReactNode;
  onDragEnd?: (result: any) => void;
  colorByDepartment?: boolean;
  colorByLevel?: boolean;
  onPreviewCourse?: (course: any) => void;
  currentPlanCourses?: any[];
}

export default function GlobalSearchLayout({ 
  children, 
  onDragEnd,
  colorByDepartment = true,
  colorByLevel = false,
  onPreviewCourse = () => {},
  currentPlanCourses = []
}: GlobalSearchLayoutProps) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="min-h-screen bg-background flex">
        {/* Left Side - Search Bar */}
        <div className="w-2/3 border-r border-border p-8">
          <div className="sticky top-8">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Search Courses</h2>
            <Droppable droppableId="search">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  <SearchBar 
                    colorByDepartment={colorByDepartment}
                    colorByLevel={colorByLevel}
                    onPreviewCourse={onPreviewCourse}
                    currentPlanCourses={currentPlanCourses}
                  />
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </div>

        {/* Right Side - Content */}
        <div className="w-1/3 p-8">
          {children}
        </div>
      </div>
    </DragDropContext>
  );
} 