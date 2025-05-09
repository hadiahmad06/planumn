"use client";

import { Draggable } from "@hello-pangea/dnd";
import { getCourseColor } from "@/lib/colors";
import CourseCardPreview from "./CourseCardPreview";
import { Box, Flex } from "@chakra-ui/react";

type Props = {
  course: {
    subject: string;
    number: string;
    title: string;
    credits: number;
    lock?: string;
  };
  index?: number;
  semName?: string;
  updateLock?: () => void;
  colorByDepartment?: boolean;
  colorByLevel?: boolean;
  isDraggable?: boolean;
  showPreview?: boolean;
  className?: string;
  onClick?: () => void;
  fixedWidth?: boolean;
  fixedHeight?: boolean;
  onPreviewCourse?: (course: {
    subject: string;
    number: string;
    title: string;
    credits: number;
    lock?: string;
  } | null) => void;
};

export default function CourseCard({
  course,
  index = 0,
  semName = "",
  updateLock,
  colorByDepartment = false,
  colorByLevel = false,
  isDraggable = true,
  showPreview = true,
  className = "",
  onClick,
  fixedWidth = false,
  fixedHeight = false,
  onPreviewCourse,
}: Props) {
  const courseColor = colorByDepartment
    ? getCourseColor(course)
    : colorByLevel
    ? getCourseColor(course)
    : "#607D8B";

  const cardContent = (
    <Box
      position="relative"
      color="white"
      rounded="md"
      fontSize="10px"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={1}
      textAlign="center"
      cursor="pointer"
      border={course.lock === "unlocked" ? "2px" : undefined}
      borderStyle={course.lock === "unlocked" ? "dotted" : undefined}
      borderColor={course.lock === "unlocked" ? "white" : undefined}
      opacity={course.lock === "autofilled" ? 0.5 : 1}
      width={fixedWidth ? "110px" : "full"}
      height={fixedHeight ? "40px" : `${course.credits * 20}px`}
      bg={courseColor}
      onClick={onClick || updateLock}
      onMouseEnter={() => onPreviewCourse?.(course)}
      onMouseLeave={() => onPreviewCourse?.(null)}
      className={className}
    >
      {course.subject} {course.number}
      {showPreview && <CourseCardPreview course={course} />}
    </Box>
  );

  if (!isDraggable) {
    return cardContent;
  }

  return (
    <Draggable draggableId={`${semName}-${index}`} index={index}>
      {(provided) => (
        <Box
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={provided.draggableProps.style}
        >
          {cardContent}
        </Box>
      )}
    </Draggable>
  );
}
