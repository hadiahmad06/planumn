import { Box, Text, VStack, Spinner } from '@chakra-ui/react';
import { useState, useEffect } from 'react';

type CoursePreviewProps = {
  course: {
    subject: string;
    number: string;
    title: string;
    credits: number;
  } | null;
};

export default function CoursePreviewPanel({ course }: CoursePreviewProps) {
  const [previewData, setPreviewData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPreviewData = async () => {
      if (!course) {
        setPreviewData(null);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/courses?subject=${course.subject}&number=${course.number}`);
        const data = await response.json();
        setPreviewData(data);
      } catch (error) {
        console.error('Error fetching course preview:', error);
      } finally {
        setLoading(false);
      }
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
          {course.subject} {course.number}
        </Text>
        <Text fontSize="lg" fontWeight="medium">
          {course.title}
        </Text>
        <Box w="100%" h="1px" bg="gray.200" />
        <Text>
          <strong>Credits:</strong> {course.credits}
        </Text>
        {loading ? (
          <Box w="100%" textAlign="center" py={4}>
            <Spinner color="gold.400" />
          </Box>
        ) : previewData ? (
          <>
            {previewData.description && (
              <Text>
                <strong>Description:</strong> {previewData.description}
              </Text>
            )}
            {previewData.prerequisites && (
              <Text>
                <strong>Prerequisites:</strong> {previewData.prerequisites}
              </Text>
            )}
            {previewData.termsOffered && previewData.termsOffered.length > 0 && (
              <Text>
                <strong>Terms Offered:</strong> {previewData.termsOffered.join(', ')}
              </Text>
            )}
          </>
        ) : null}
      </VStack>
    </Box>
  );
} 