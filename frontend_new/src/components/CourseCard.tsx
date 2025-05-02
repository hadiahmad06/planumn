"use client";

import { Draggable } from "@hello-pangea/dnd";
import { getCourseColor } from "@/lib/colors";
import CourseCardPreview from "./CourseCardPreview";

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
  let borderStyle = "";
  let opacity = "opacity-100";
  let filter = "";

  if (course.lock === "unlocked") {
    borderStyle = "border-2 border-dotted border-white";
  } else if (course.lock === "autofilled") {
    filter = "saturate-50";
  }

  const courseColor = colorByDepartment
    ? getCourseColor(course)
    : colorByLevel
    ? getCourseColor(course)
    : "#607D8B";

  const cardContent = (
    <div
      className={`relative group text-white rounded-md text-[10px] flex items-center justify-center px-1 text-center cursor-pointer ${borderStyle} ${opacity} ${filter} ${className} ${fixedWidth ? 'w-[110px]' : 'w-full'} ${fixedHeight ? 'h-[40px]' : ''}`}
      style={{
        backgroundColor: courseColor,
        height: fixedHeight ? undefined : `${course.credits * 20}px`,
      }}
      onClick={onClick || updateLock}
      onMouseEnter={() => onPreviewCourse?.(course)}
      onMouseLeave={() => onPreviewCourse?.(null)}
    >
      {course.subject} {course.number}
      {showPreview && <CourseCardPreview course={course} />}
    </div>
  );

  if (!isDraggable) {
    return cardContent;
  }

  return (
    <Draggable draggableId={`${semName}-${index}`} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={provided.draggableProps.style}
        >
          {cardContent}
        </div>
      )}
    </Draggable>
  );
}
