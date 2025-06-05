import { Course, CourseDetails } from '@/types/plan';
import { Box, Text, Stack, Loader, Group } from '@mantine/core';
import { useState, useEffect } from 'react';
import { BarChart } from '../atoms/barchart';
import { AreaChart } from '../atoms/areachart';

type CoursePreviewProps = {
  course: CourseDetails | null;
};

export default function CoursePreviewPanel({ course }: CoursePreviewProps) {

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPreviewData = async () => {
      if (!course) {
        return;
      }

      setLoading(true);
    };

    fetchPreviewData();
  }, [course]);
  console.log(typeof course?.total_grades); // is it "string" or "object"?


  if (!course) return null;

  return (
    <Box
      style={{
        width: "77%",
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 6px 18px rgba(0, 0, 0, 0.08)",
        border: "1px solid rgba(255, 215, 0, 0.4)",
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
    </Box>
  );
}