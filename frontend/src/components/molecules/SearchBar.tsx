"use client";

import { useState, useEffect, useRef, useContext } from "react";
import { Draggable } from "@hello-pangea/dnd";
import CourseCard from "./CourseCard";
import { Box, Input, Text, Flex, Paper } from "@mantine/core";
import { Course, CourseDetails } from "@/types/plan";
import { DisplaySettingsContext } from "@/contexts/DisplaySettingsContext";
import { PlanContext } from "@/contexts/PlanContext";

export type ColorKey = 'department' | 'level' | 'none';

type Props = {
  onPreviewCourse?: (course: CourseDetails | null) => void;
};

export default function SearchBar({ onPreviewCourse }: Props) {
  const { colorKey } = useContext(DisplaySettingsContext);
  const { cachedCourses } = useContext(PlanContext);

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
      const excludeKeys = Object.keys(cachedCourses);
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&exclude=${encodeURIComponent(JSON.stringify(excludeKeys))}`);
      const data = await res.json();
      setResults(data);
    };

    const delayDebounce = setTimeout(() => {
      fetchResults();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query, cachedCourses]);

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
        border: '1px solid transparent',
        padding: '0.3rem 0.75rem',
        boxShadow: isFocused
          ? '0 0 0 4px rgba(209, 99, 145, 0.25), 0 6px 18px rgba(0, 0, 0, 0.1)'
          : '0 2px 8px rgba(0, 0, 0, 0.06)',
        outline: isFocused ? '1px solid #811331' : '1px solid #ccc',
        transition: 'all 0.2s ease',
        overflow: 'visible',
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
        <Paper
          withBorder
          radius="md"
          shadow="xs"
          style={{
            width: "100%",
            marginTop: "0.25rem",
            marginBottom: "0.5rem",
            maxHeight: "60vh",
            overflowY: "auto",
            backgroundColor: "white",
            opacity: isDragging ? 0.5 : 1,
            pointerEvents: isDragging ? "none" : "auto",
            transition: "opacity 0.2s"
          }}
        >
          <table style={{ width: '100%' }}>
            <tbody>
              {sortedKeys.map((key) => (
                <tr key={key} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.5rem', backgroundColor: 'var(--card)', fontWeight: 'semibold', color: 'var(--secondary)', width: '96px' }}>
                    {key}
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <Flex wrap="wrap" gap={2}>
                      {groupedResults[key].map((course, index) => (
                        <Draggable
                          key={`search-${course.dept_abbr}-${course.course_num}`}
                          draggableId={JSON.stringify(course)}
                          index={index}
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
                                colorKey={colorKey} // Pass colorKey directly to CourseCard
                                isDraggable={false}
                                fixedWidth={true}
                                fixedHeight={true}
                              />
                            </Box>
                          )}
                        </Draggable>
                      ))}
                    </Flex>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Paper>
      )}
    </Box>
  );
}