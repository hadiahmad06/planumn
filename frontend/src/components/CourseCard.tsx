"use client";

import { Draggable } from "@hello-pangea/dnd";
import { getCourseColor } from "@/lib/colors";

type Props = {
  course: any;
  index: number;
  semName: string;
  updateLock: () => void;
  colorByDepartment: boolean;
  colorByLevel: boolean;
};

export default function CourseCard({
  course,
  index,
  semName,
  updateLock,
  colorByDepartment,
  colorByLevel,
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

  return (
    <Draggable draggableId={`${semName}-${index}`} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`relative group text-white rounded-md text-xs flex items-center justify-center px-2 text-center cursor-pointer ${borderStyle} ${opacity} ${filter}`}
          style={{
            backgroundColor: courseColor,
            width: `100%`,
            height: `${course.credits * 20}px`,
            ...provided.draggableProps.style,
          }}
          onClick={updateLock}
        >
          {course.subject} {course.number}
          <div className="absolute z-50 hidden group-hover:block group-focus:block left-full ml-2 w-64 p-2 text-xs text-black bg-white border rounded shadow-lg transition-opacity duration-200 delay-500 group-hover:delay-500">
            <strong>{course.title}</strong>
            <div>Credits: {course.credits}</div>
            <div className="italic text-gray-500 mt-1">Prereqs: TBD</div>
            <div className="mt-1 text-xs font-semibold">Lock: {course.lock}</div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
