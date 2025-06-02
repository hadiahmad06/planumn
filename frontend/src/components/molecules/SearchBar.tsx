"use client";

import { useState, useEffect, useRef } from "react";
import { Draggable } from "@hello-pangea/dnd";
import CourseCard from "./CourseCard";
import { Box, Input, Text, Flex } from "@chakra-ui/react";
import { Course, CourseDetails } from "@/types/plan";
// import CoursePreview from './CoursePreview';

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
  const [isFocused, setIsFocused] = useState(false); // Added state to track focus
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
      position="relative"
      width="100%"
      border="1px"
      borderColor="gold.200"
      borderRadius="lg"
      boxShadow="0 2px 4px rgba(212, 175, 55, 0.2)"
      bg="white"
      display="flex"
      flexDirection="column"
    >
      <Box position="relative">
        <Text
          position="absolute"
          left={4}
          top="50%"
          transform="translateY(-50%)"
          fontSize="lg"
          color="gold.400"
          zIndex={1}
        >
          🔍
        </Text>
        <Input
          type="text"
          placeholder="Search by course name, department, or code..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setIsFocused(true); // Set focus state to true
          }}
          onBlur={() => {
            setIsFocused(false); // Set focus state to false
          }}
          width="100%"
          pl={12}
          py={3}
          border="1px"
          borderColor="gold.200"
          rounded="md"
          fontSize="md"
          _focus={{
            outline: "none",
            ring: "2px",
            ringColor: "gold.200",
            borderColor: "gold.400"
          }}
        />
      </Box>
      {isOpen && isFocused && results.length > 0 && ( // Added isFocused condition
        <Box
          position="absolute"
          zIndex={50}
          width="full"
          mt={1}
          border="1px"
          borderColor="gold.200"
          rounded="md"
          bg="white"
          maxH="60vh"
          overflowY="auto"
          boxShadow="0 4px 6px rgba(212, 175, 55, 0.2)"
          transition="opacity 0.2s"
          opacity={isDragging ? 0.5 : 1}
          pointerEvents={isDragging ? "none" : "auto"}
          top="100%"
          left={0}
        >
          <table style={{ width: '100%' }}>
            <tbody>
              
              {(() => { let globalIndex = 0;
              return sortedKeys.map((key) => (
                <tr key={key} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.5rem', backgroundColor: 'var(--card)', fontWeight: 'semibold', color: 'var(--secondary)', width: '96px' }}>
                    {key}
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <Flex flexWrap="wrap" gap={2}>
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
                                colorKey={colorKey} // Pass colorKey directly to CourseCard
                                isDraggable={false}
                                fixedWidth={true}
                                fixedHeight={true}
                              />
                            </Box>
                          )}
                        </Draggable>
                      )})}
                    </Flex>
                  </td>
                </tr>
              ))})()}
            </tbody>
          </table>
        </Box>
      )}
    </Box>
  );
}