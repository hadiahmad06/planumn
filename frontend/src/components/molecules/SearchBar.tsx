"use client";

import { useState, useEffect, useRef } from "react";
import { Draggable } from "@hello-pangea/dnd";
import CourseCard from "./CourseCard";
import { Box, Input, Text, Flex } from "@mantine/core";
import { Course, CourseDetails } from "@/types/plan";

export type ColorKey = 'department' | 'level' | 'none';

type Props = {
  colorKey?: ColorKey; // Updated to use ColorKey
  onPreviewCourse?: (course: CourseDetails | null) => void;
  currentPlanCourses?: number[];
};

export default function SearchBar({ 
  colorKey = 'none', // Updated default value to match ColorKey
  onPreviewCourse,
  currentPlanCourses = []
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CourseDetails[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
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

  // Group courses based on colorKey
  const groupedResults = results.reduce((acc, course) => {
    const key = colorKey === 'level' 
      ? course.dept_abbr // Group by department when colorKey is level
      : `${Math.floor(parseInt(course.course_num) / 1000)}xxx` // Group by level when colorKey is department

    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(course);
    return acc;
  }, {} as Record<string, CourseDetails[]>);

  // Sort keys based on colorKey
  const sortedKeys = Object.keys(groupedResults).sort((a, b) => 
    colorKey === 'department' 
      ? parseInt(a) - parseInt(b) // Sort levels numerically
      : a.localeCompare(b) // Sort departments alphabetically
  );

  return (
    <Box
      ref={searchRef}
      style={{
        position: 'relative',
        width: '100%',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: isFocused ? '1px solid #811331' : '1px solid #ccc',
        padding: '0.3rem 0.75rem',
        boxShadow: isFocused
          ? '0 0 0 4px rgba(209, 99, 145, 0.25), 0 6px 18px rgba(0, 0, 0, 0.1)'
          : '0 2px 8px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.2s ease',
      }}
    >
      <Box style={{ position: 'relative' }}>
        <Input
          unstyled
          type="text"
          placeholder="Search by course name, department, or code..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setIsFocused(true);
          }}
          onBlur={() => {
            setIsFocused(false);
          }}
          styles={{
            input: {
              border: 'none',
              outline: 'none',
              padding: '0.3rem 0',
              width: '100%',
              fontSize: '0.95rem',
              background: 'transparent',
              color: '#333',
            }
          }}
        />
      </Box>
      {isOpen && isFocused && results.length > 0 && (
        <Box
          mt={8}
          style={{
            border: '1px solid #eee',
            borderRadius: '6px',
            backgroundColor: '#fff',
            maxHeight: '60vh',
            overflowY: 'auto',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            opacity: isDragging ? 0.5 : 1,
            transform: isOpen && isFocused ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.2s ease, transform 0.2s ease',
          }}
        >
          <table style={{ width: '100%' }}>
            <tbody>
              {(() => {
                let globalIndex = 0;
                return sortedKeys.map((key, index) => (
                  <tr
                    key={key}
                    style={{
                      borderBottom: '1px solid #f0f0f0',
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f8f8',
                    }}
                  >
                    <td
                      style={{
                        padding: '0.5rem',
                        backgroundColor: '#f9f9f9',
                        fontWeight: 600,
                        color: '#666',
                        width: '96px',
                      }}
                    >
                      {key}
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <Flex wrap="wrap" gap={8}>
                        {groupedResults[key].map((course) => {
                          const currentIndex = globalIndex++;
                          return (
                            <Draggable
                              key={`search-${course.id}`}
                              draggableId={JSON.stringify(course)}
                              index={currentIndex}
                            >
                              {(provided) => (
                                <Box
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onMouseEnter={() => onPreviewCourse?.(course)}
                                  onMouseLeave={() => onPreviewCourse?.(null)}
                                >
                                  <CourseCard
                                    course={course}
                                    colorKey={colorKey}
                                    isDraggable={false}
                                    fixedWidth={true}
                                    fixedHeight={true}
                                  />
                                </Box>
                              )}
                            </Draggable>
                          );
                        })}
                      </Flex>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </Box>
      )}
    </Box>
  );
}