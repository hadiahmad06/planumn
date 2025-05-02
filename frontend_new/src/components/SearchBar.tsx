"use client";

import { useState, useEffect, useRef } from "react";
import { Draggable } from "@hello-pangea/dnd";
import CourseCard from "./CourseCard";

type Course = {
  dept: string;
  number: string;
  title: string;
  credits: number;
  description: string;
  prerequisites: string;
  termsOffered: string[];
};

type Props = {
  colorByDepartment?: boolean;
  colorByLevel?: boolean;
  onPreviewCourse?: (course: {
    subject: string;
    number: string;
    title: string;
    credits: number;
  } | null) => void;
  currentPlanCourses?: {
    subject: string;
    number: string;
    title: string;
    credits: number;
  }[];
};

export default function SearchBar({ 
  colorByDepartment = true, 
  colorByLevel = false,
  onPreviewCourse,
  currentPlanCourses = []
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Course[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onPreviewCourse?.(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onPreviewCourse]);

  useEffect(() => {
    const fetchResults = async () => {
      if (query.length === 0) {
        setResults([]);
        onPreviewCourse?.(null);
        return;
      }

      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&exclude=${encodeURIComponent(JSON.stringify(currentPlanCourses))}`);
      const data = await res.json();
      setResults(data);
    };

    const delayDebounce = setTimeout(() => {
      fetchResults();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query, onPreviewCourse, currentPlanCourses]);

  // Group courses by level (1xxx, 2xxx, etc.)
  const groupedResults = results.reduce((acc, course) => {
    const level = Math.floor(parseInt(course.number) / 1000);
    const levelKey = `${level}xxx`;
    if (!acc[levelKey]) {
      acc[levelKey] = [];
    }
    acc[levelKey].push(course);
    return acc;
  }, {} as Record<string, Course[]>);

  // Sort levels in ascending order
  const sortedLevels = Object.keys(groupedResults).sort((a, b) => 
    parseInt(a) - parseInt(b)
  );

  return (
    <div ref={searchRef} className="relative w-full mb-6">
      <input
        type="text"
        placeholder="Search by course name, department, or code..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        className="w-full px-4 py-2 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      />
      {isOpen && results.length > 0 && (
        <div 
          className={`absolute z-50 w-full mt-1 border border-border rounded bg-white max-h-150 overflow-y-auto shadow-lg transition-opacity duration-200 ${isDragging ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <table className="w-full">
            <tbody>
              {sortedLevels.map((level) => (
                <tr key={level} className="border-b border-border">
                  <td className="px-4 py-2 bg-card font-semibold text-secondary w-24">
                    {level}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-2">
                      {groupedResults[level].map((course, index) => (
                        <Draggable
                          key={`search-${course.dept}-${course.number}`}
                          draggableId={JSON.stringify({
                            subject: course.dept,
                            number: course.number,
                            title: course.title,
                            credits: course.credits
                          })}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onMouseEnter={() => onPreviewCourse?.({
                                subject: course.dept,
                                number: course.number,
                                title: course.title,
                                credits: course.credits,
                              })}
                              onMouseLeave={() => onPreviewCourse?.(null)}
                            >
                              <CourseCard
                                course={{
                                  subject: course.dept,
                                  number: course.number,
                                  title: course.title,
                                  credits: course.credits,
                                }}
                                isDraggable={false}
                                fixedWidth={true}
                                fixedHeight={true}
                                className="shadow-sm"
                                colorByDepartment={colorByDepartment}
                                colorByLevel={colorByLevel}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}