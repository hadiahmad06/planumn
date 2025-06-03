"use client";

import { Box } from '@mantine/core';
import { Draggable } from '@hello-pangea/dnd';
import { getCourseColor } from '@/lib/colors';
import { ColorKey, CourseDetails } from '@/types/plan';

const CARD_PADDING = '0.5rem';
const CARD_FIXED_FONT_SIZE = '14px';
const CARD_FIXED_WIDTH = '110px';
const CARD_FIXED_HEIGHT = '40px';
const CARD_HEIGHT_MULTIPLIER = 20;

export default function CourseCard({
  course,
  index = 0,
  semName = '',
  updateLock,
  colorKey = 'none',
  isDraggable = true,
  className = '',
  onClick,
  fixedWidth = false,
  fixedHeight = false,
  fontSize = CARD_FIXED_FONT_SIZE,
  onPreviewCourse,
}: {
  course: CourseDetails;
  index?: number;
  semName?: string;
  updateLock?: () => void;
  colorKey?: ColorKey;
  isDraggable?: boolean;
  className?: string;
  onClick?: () => void;
  fixedWidth?: boolean;
  fixedHeight?: boolean;
  fontSize?: string;
  onPreviewCourse?: (course: CourseDetails | null) => void;
}) {
  const courseColor = colorKey === 'department'
    ? getCourseColor(course, 'department')
    : colorKey === 'level'
    ? getCourseColor(course, 'level')
    : '#607D8B';

  const cardContent = (
    <Box
      style={{
        position: 'relative',
        color: 'white',
        borderRadius: 'md',
        fontSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: CARD_PADDING,
        textAlign: 'center',
        cursor: 'pointer',
        border: course.lock === 'unlocked' ? '2px dotted white' : undefined,
        opacity: course.lock === 'autofilled' ? 0.5 : 1,
        width: fixedWidth ? CARD_FIXED_WIDTH : '100%',
        height: fixedHeight ? CARD_FIXED_HEIGHT : `${course.cred_min * CARD_HEIGHT_MULTIPLIER}px`,
        backgroundColor: courseColor,
        transition: 'transform 0.2s',
      }}
      onClick={onClick || updateLock}
      onMouseEnter={() => onPreviewCourse?.(course)}
      onMouseLeave={() => onPreviewCourse?.(null)}
      className={className}
    >
      {course.dept_abbr} {course.course_num}
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
