import { Course, CourseDetails } from '@/types/plan';
import { Box, Text, Stack, Loader } from '@mantine/core';
import { useState, useEffect } from 'react';

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

  if (!course) return null;

  return (
    <Box
      style={{
        width: "100%",
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
        <Text style={{ fontSize: "0.95rem", color: "#555" }}>
          <strong>Credits:</strong>{" "}
          {course.cred_min === course.cred_max ? course.cred_min : `${course.cred_min} - ${course.cred_max}`}
        </Text>
        <Text style={{ fontSize: "0.95rem", color: "#555" }}>
          <strong>Description:</strong> {course.onestop_desc}
        </Text>
        <Text style={{ fontSize: "0.95rem", color: "#555" }}>
          <strong>Total # of Students:</strong> {course.total_students}
        </Text>
      </Stack>
    </Box>
  );
}