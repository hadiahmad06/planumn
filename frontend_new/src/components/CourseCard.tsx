"use client";

import { Draggable } from "@hello-pangea/dnd";
import { getCourseColorByDepartment, getCourseColorByLevel } from "@/lib/colors";
import { Box } from "@chakra-ui/react";

// Sizing
const CARD_PADDING = 1;
const CARD_FIXED_FONT_SIZE = "14px";
const CARD_FIXED_WIDTH = "110px";
const CARD_FIXED_HEIGHT = "40px";
const CARD_HEIGHT_MULTIPLIER = 20; // credits * this value = height

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
  className?: string;
  onClick?: () => void;
  fixedWidth?: boolean;
  fixedHeight?: boolean;
  fontSize?: string;
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
  className = "",
  onClick,
  fixedWidth = false,
  fixedHeight = false,
  fontSize = CARD_FIXED_FONT_SIZE,
  onPreviewCourse,
}: Props) {
  const courseColor = colorByDepartment
    ? getCourseColorByDepartment(course)
    : colorByLevel
    ? getCourseColorByLevel(course)
    : "#607D8B";

  const cardContent = (
    <Box
      position="relative"
      color="white"
      rounded="md"
      fontSize={fontSize}
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={CARD_PADDING}
      textAlign="center"
      cursor="pointer"
      border={course.lock === "unlocked" ? "2px" : undefined}
      borderStyle={course.lock === "unlocked" ? "dotted" : undefined}
      borderColor={course.lock === "unlocked" ? "white" : undefined}
      opacity={course.lock === "autofilled" ? 0.5 : 1}
      width={fixedWidth ? CARD_FIXED_WIDTH : "full"}
      height={fixedHeight ? CARD_FIXED_HEIGHT : `${course.credits * CARD_HEIGHT_MULTIPLIER}px`}
      bg={courseColor}
      onClick={onClick || updateLock}
      onMouseEnter={() => onPreviewCourse?.(course)}
      onMouseLeave={() => onPreviewCourse?.(null)}
      className={className}
      transition="transform 0.2s"
      _hover={{ transform: "scale(1.05)" }}
    >
      {course.subject} {course.number}
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
