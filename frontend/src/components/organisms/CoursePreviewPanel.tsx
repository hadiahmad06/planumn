import { Course, CourseDetails } from '@/types/plan';
import { Box, Text, Stack, Group, Dialog, Skeleton } from '@mantine/core';
import { useContext, useState, useEffect } from 'react';
import { BarChart } from '../atoms/course-preview/barchart';
import { AreaChart } from '../atoms/course-preview/areachart';
import { PreviewContext, PreviewPosition } from '@/contexts/PreviewContext';
import { getCourseDetails } from '@/types/planHandlers';

const mapPositionToCoords = (pos: PreviewPosition | null) => {
  const DEFAULT_MARGIN = 40;
  
  switch (pos) {
    case 'top-left':
      return { top: DEFAULT_MARGIN, left: DEFAULT_MARGIN };
    case 'top-right':
      return { top: DEFAULT_MARGIN, right: DEFAULT_MARGIN };
    case 'bottom-left':
      return { bottom: DEFAULT_MARGIN, left: DEFAULT_MARGIN };
    case 'bottom-right':
      return { bottom: DEFAULT_MARGIN, right: DEFAULT_MARGIN };
    case 'top':
      return { top: DEFAULT_MARGIN, left: '50%', transform: 'translateX(-50%)' };
    case 'bottom':
      return { bottom: DEFAULT_MARGIN, left: '50%', transform: 'translateX(-50%)' };
    case 'left':
      return { left: DEFAULT_MARGIN, top: '50%', transform: 'translateY(-50%)' };
    case 'right':
      return { right: DEFAULT_MARGIN, top: '50%', transform: 'translateY(-50%)' };
    default:
      return { bottom: DEFAULT_MARGIN, right: DEFAULT_MARGIN }; // Default fallback
  }
};

export default function CoursePreviewPanel() {
  const { persistCourse, tempCourse, persistPos, tempPos } = useContext(PreviewContext);
  const incomingCourse = tempCourse ?? persistCourse;
  const incomingPos = tempPos ?? persistPos;
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFullCourseDetails = async () => {
      if (!incomingCourse) {
        setCourse(null);
        return;
      }

      // Check if we already have full details
      if ('dept_abbr' in incomingCourse && 
          'total_grades' in incomingCourse && 
          'class_desc' in incomingCourse &&
          'cred_min' in incomingCourse &&
          'cred_max' in incomingCourse &&
          'total_students' in incomingCourse &&
          'onestop_desc' in incomingCourse
      ) {
        setCourse(incomingCourse as CourseDetails);
        return;
      }

      // If not, fetch the full details
      try {
        setLoading(true);
        const fullCourse = await getCourseDetails(String(incomingCourse.id));
        setCourse(fullCourse);
      } catch (error) {
        console.error('Error fetching course details:', error);
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFullCourseDetails();
  }, [incomingCourse]);

  if (loading || !course) {
    return <Skeleton w="100%" h="300px"/>;
  }

  return (
    <Dialog
      opened={true}
      withCloseButton={false}
      position={mapPositionToCoords(incomingPos)}
      style={{
      width: "50%",
      backgroundColor: "white",
      padding: "20px",
      borderRadius: "12px",
      boxShadow: "0 8px 20px rgba(100, 149, 237, 0.3)",
      border: "1px solid rgba(100, 149, 237, 0.4)",
      transition: "all 0.2s ease",
      }}
    >
      <Stack gap="md" style={{ alignItems: "flex-start" }}>
      <Text
        style={{
        fontSize: "1.375rem",
        fontWeight: 700,
        color: "#800000",
        }}
      >
        {course.dept_abbr} {course.course_num}
      </Text>
      <Text
        style={{
        fontSize: "1.125rem",
        fontWeight: 500,
        color: "#333",
        }}
      >
        {course.class_desc}
      </Text>
      <Box style={{ width: "100%", height: "1px", backgroundColor: "#E5E5E5" }} />
      
      <Group justify="space-between" style={{ width: '100%' }}>
        <Stack gap="xs" style={{ flexGrow: 1 }}>
        <Text style={{ fontSize: "0.95rem", color: "#555" }}>
          <strong>Credits:</strong>{" "}
          {course.cred_min === course.cred_max ? course.cred_min : `${course.cred_min} - ${course.cred_max}`}
        </Text>
        <Text style={{ fontSize: "0.95rem", color: "#555" }}>
          <strong>Total # of Students:</strong> {course.total_students}
        </Text>
        </Stack>
        <Group align="center" style={{ flexShrink: 0 }}>
        <BarChart distribution={{ grades: typeof course.total_grades === 'string'
          ? JSON.parse(course.total_grades)
          : course.total_grades, isSummary: false }} isMobile={false} />
        <AreaChart distribution={{ grades: typeof course.total_grades === 'string'
          ? JSON.parse(course.total_grades)
          : course.total_grades, isSummary: false }} isMobile={false} averageGPA={course.total_grades} />
        </Group>
      </Group>

      <Text style={{ fontSize: "0.95rem", color: "#555" }}>
        <strong>Description:</strong> {course.onestop_desc}
      </Text>

      </Stack>
    </Dialog>
  );
}