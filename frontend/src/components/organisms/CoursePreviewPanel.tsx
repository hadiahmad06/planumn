import { Course, CourseDetails } from '@/types/plan';
import { Box, Text, Stack, Loader } from '@mantine/core';
import { useState, useEffect } from 'react';
import { BarChart } from '../molecules/barchart';
import { AreaChart } from '../molecules/areachart';

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
        width: "100%",
        backgroundColor: "white",
        padding: "16px",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(212, 175, 55, 0.2)",
        border: "1px solid",
        borderColor: "#FFD700",
        position: "relative",
      }}
    >
      {/* Charts in top right */}
      <div style={{ position: 'absolute', top: '16px', right: 0, display: 'flex', gap: '8px', padding: '16px', zIndex: 1 }}>
        <BarChart distribution={{ grades: typeof course.total_grades === 'string'
          ? JSON.parse(course.total_grades)
          : course.total_grades, isSummary: false }} isMobile={false} />
        <AreaChart distribution={{ grades: typeof course.total_grades === 'string'
          ? JSON.parse(course.total_grades)
          : course.total_grades, isSummary: false }} isMobile={false} averageGPA={course.total_grades} />
      </div>
      <Stack style={{ alignItems: "start", gap: "16px" }}>
        <Text
          style={{
            fontSize: "1.25rem", /* equivalent to xl */
            fontWeight: "bold",
            color: "#800000",
          }}
        >
          {course.dept_abbr} {course.course_num}
        </Text>
        <Text
          style={{
            fontSize: "1.125rem", /* equivalent to lg */
            fontWeight: "500",
          }}
        >
          {course.class_desc}
        </Text>
        <Box style={{ width: "100%", height: "1px", backgroundColor: "#E0E0E0" }} />
        <Text>
          <strong>Credits:</strong> {course.cred_min === course.cred_max ? course.cred_min : `${course.cred_min} - ${course.cred_max}`}
        </Text>
        <Text>
          <strong>Description:</strong> {course.onestop_desc}
        </Text>
        <Text>
          <strong>Total # of Students:</strong> {course.total_students}
        </Text>
      </Stack>
    </Box>
  );
}