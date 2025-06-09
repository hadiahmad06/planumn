"use client";

import { Box, Skeleton } from '@mantine/core';
import { Draggable } from '@hello-pangea/dnd';
import { getCourseColor } from '@/lib/colors';
import { ColorKey, CourseDetails, CourseStub, PlannedCourse } from '@/types/plan';
import { useContext } from 'react';
import { PlanContext } from '@/contexts/PlanContext';
import { DisplaySettingsContext } from '@/contexts/DisplaySettingsContext';
import { PreviewContext } from '@/contexts/PreviewContext';

const CARD_PADDING = '0.5rem';
const CARD_FIXED_FONT_SIZE = '14px';
const CARD_FIXED_WIDTH = '110px';
const CARD_FIXED_HEIGHT = '40px';
const CARD_HEIGHT_MULTIPLIER = 20;

export default function CourseCard({
  courseId,
  index = 0,
  semName = '',
  updateLock,
  isDraggable = true,
  className = '',
  fixedWidth = false,
  fixedHeight = false,
  fontSize = CARD_FIXED_FONT_SIZE,
  source = 'search'
}: {
  courseId: number;
  index?: number;
  semName?: string;
  updateLock?: () => void;
  // colorKey?: ColorKey;
  isDraggable?: boolean;
  className?: string;
  fixedWidth?: boolean;
  fixedHeight?: boolean;
  fontSize?: string;
  source?: "search" | "plan" | null;
}) {
  const { cachedCourses, cachedSearchResults } = useContext(PlanContext);
  const { colorKey } = useContext(DisplaySettingsContext);
  const { setTempPreview, setPersistPreview } = useContext(PreviewContext);
  const course: PlannedCourse | CourseStub = cachedCourses[courseId] || cachedSearchResults[courseId];

  if (!course) return <Skeleton w={CARD_FIXED_WIDTH} h={CARD_FIXED_HEIGHT}/>

  const courseColor = !course ? '#607D8B' 
  : colorKey === 'department'
    ? getCourseColor(course, 'department')
    : colorKey === 'level'
    ? getCourseColor(course, 'level')
    : '#607D8B';

  const cardContent = (
    <Box
      style={{
      position: 'relative',
      color: 'white',
      borderRadius: '6px',
      fontSize,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: CARD_PADDING,
      textAlign: 'center',
      cursor: 'pointer',
      border: ('lock' in course) ? course.lock === 'unlocked' ? '2px dotted white' : undefined : undefined,
      opacity:  ('lock' in course) ? course.lock === 'autofilled' ? 0.5 : 1 : 1,
      width: fixedWidth ? CARD_FIXED_WIDTH : '100%',
      height: fixedHeight
        ? CARD_FIXED_HEIGHT
        : `${('cred_min' in course ? course.cred_min : 1) * CARD_HEIGHT_MULTIPLIER}px`,
      backgroundColor: courseColor,
      transition: 'transform 0.2s',
      }}
      onClick={() => setPersistPreview?.(course, source === "search" ? "bottom-right" : "bottom-left")}
      onPointerEnter={() => setTempPreview?.(course, source === "search" ? "bottom-right" : "bottom-left")}
      onPointerLeave={() => setTempPreview?.(null, null)}
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
