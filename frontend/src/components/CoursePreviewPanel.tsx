import { Course, CourseDetails } from '@/types/plan';
import { Box, Text, VStack, Spinner } from '@chakra-ui/react';
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
      width="100%"
      bg="white"
      p={4}
      borderRadius="lg"
      boxShadow="0 4px 6px rgba(212, 175, 55, 0.2)"
      border="1px"
      borderColor="gold.200"
    >
      <VStack align="start" gap={3}>
        <Text fontSize="xl" fontWeight="bold" color="maroon.500">
          {course.dept_abbr} {course.course_num}
        </Text>
        <Text fontSize="lg" fontWeight="medium">
          {course.class_desc}
        </Text>
        <Box w="100%" h="1px" bg="gray.200" />
        <Text>
          <strong>Credits:</strong> {course.cred_min === course.cred_max ? course.cred_min : `${course.cred_min} - ${course.cred_max}`}
        </Text>
        <Text>
          <strong>Description:</strong> {course.onestop_desc}
        </Text>
        <Text>
          <strong>Total # of Students:</strong> {course.total_students}
        </Text>
      </VStack>
    </Box>
  );
} 