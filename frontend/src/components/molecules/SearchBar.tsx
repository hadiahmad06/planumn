"use client";

import { useState, useEffect, useRef, useContext } from "react";
import { Draggable } from "@hello-pangea/dnd";
import CourseCard from "./CourseCard";
import { Box, Input, Text, Flex, Paper } from "@mantine/core";
import { Course, CourseDetails, CourseStub } from "@/types/plan";
import { DisplaySettingsContext } from "@/contexts/visual/DisplaySettingsContext";
import { PlanContext } from "@/contexts/data/PlanContext";
import { MenuRow } from "@/components/atoms/ContextMenu";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconCopy, IconExternalLink } from "@tabler/icons-react";

export type ColorKey = 'department' | 'level' | 'none';

export default function SearchBar() {
  const { colorKey } = useContext(DisplaySettingsContext);
  const { cachedCourses, setCachedSearchResults, plan, setPlan } = useContext(PlanContext);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CourseStub[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [selectedCourse, setSelectedCourse] = useState<CourseStub | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (query.length === 0) {
        setResults([]);
        return;
      }
      const excludeKeys = Object.keys(cachedCourses);
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&exclude=${encodeURIComponent(JSON.stringify(excludeKeys))}`);
      const data = await res.json() as CourseStub[];
      setResults(data);
      setCachedSearchResults(
        Object.fromEntries(data.map((course) => [course.id, course]))
      );
    };

    const delayDebounce = setTimeout(() => {
      fetchResults();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query, cachedCourses]);

  const handleAddToPlan = (course: CourseStub) => {
    if (!plan) {
      notifications.show({
        title: "Error",
        message: "No plan loaded",
        color: "red",
      });
      return;
    }

    const firstSemester = plan.semesters[0];
    if (!firstSemester) {
      notifications.show({
        title: "Error",
        message: "No semesters available",
        color: "red",
      });
      return;
    }

    const updated = { ...plan, semesters: [...plan.semesters] };
    const sem = updated.semesters.find((s) => s.index === firstSemester.index);
    if (sem) {
      sem.courses.push({
        id: course.id,
        lock: "unlocked",
      });
      setPlan(updated);
      notifications.show({
        title: "Success",
        message: `Added ${course.dept_abbr} ${course.course_num} to ${firstSemester.index}`,
        color: "green",
      });
    }
  };

  const handleCopyCourseCode = (course: CourseStub) => {
    const courseCode = `${course.dept_abbr} ${course.course_num}`;
    navigator.clipboard.writeText(courseCode).then(() => {
      notifications.show({
        title: "Copied",
        message: courseCode,
        color: "green",
      });
    });
  };

  const handleOpenInCatalog = (course: CourseStub) => {
    window.open(`https://onestop2.umn.edu/psp/ps/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES.CLASS_SEARCH.GBL?Page=CLASS_SRCH_WRK2_SSRPB_SCR_DESCR&Action=U&ACAD_YEAR=2024&STRM=1249&SUBJ=${course.dept_abbr}&CATALOG_NBR=${course.course_num}`, "_blank");
  };

  const getContextMenuRows = (course: CourseStub): MenuRow[] => [
    {
      buttons: [
        {
          label: "Add to Plan",
          icon: <IconPlus size={16} />,
          onClick: () => handleAddToPlan(course),
          color: "green",
        },
        {
          label: "Copy Course Code",
          icon: <IconCopy size={16} />,
          onClick: () => handleCopyCourseCode(course),
        },
        {
          label: "Open in Catalog",
          icon: <IconExternalLink size={16} />,
          onClick: () => handleOpenInCatalog(course),
        },
      ],
    },
  ];

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
  }, {} as Record<string, CourseStub[]>);

  // Sort keys based on colorKey
  const sortedKeys = Object.keys(groupedResults).sort((a, b) => 
    colorKey === 'department' 
      ? parseInt(a) - parseInt(b) // Sort levels numerically
      : a.localeCompare(b) // Sort departments alphabetically
  );

  // Dimensions
  const SEMESTER_BOX_WIDTH = "170px";
  const SEMESTER_BOX_MIN_HEIGHT = "110px";
  const CREDIT_LINE_HEIGHT = "24px"; // or 22px

  // Typography
  const SEMESTER_TITLE_SIZE = "18px"; // or 20px

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
                              >
                                <CourseCard
                                  courseId={course.id}
                                  isDraggable={false}
                                  fixedWidth={true}
                                  fixedHeight={true}
                                  source="search"
                                  contextMenuRows={getContextMenuRows(course)}
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