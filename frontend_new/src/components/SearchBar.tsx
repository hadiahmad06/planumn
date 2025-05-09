"use client";

import { useState, useEffect, useRef } from "react";
import { Draggable } from "@hello-pangea/dnd";
import CourseCard from "./CourseCard";
import { Box, Input, Text, Flex } from "@chakra-ui/react";
import CoursePreview from './CoursePreview';

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
  const [previewCourse, setPreviewCourse] = useState<Course | null>(null);
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
          onFocus={() => setIsOpen(true)}
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
      {isOpen && results.length > 0 &&
        <Box
          position="absolute"
          zIndex={50}
          width="full"
          mt={1}
          border="1px"
          borderColor="gold.200"
          rounded="md"
          bg="white"
          maxH="80vh"
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
              {sortedLevels.map((level) => (
                <tr key={level} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.5rem', backgroundColor: 'var(--card)', fontWeight: 'semibold', color: 'var(--secondary)', width: '96px' }}>
                    {level}
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <Flex flexWrap="wrap" gap={2}>
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
                            <Box
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
                                colorByDepartment={colorByDepartment}
                                colorByLevel={colorByLevel}
                                isDraggable={false}
                                showPreview={false}
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
        </Box>
      }
    </Box>
  );
}