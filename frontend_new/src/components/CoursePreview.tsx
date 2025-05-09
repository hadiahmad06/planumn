import { Box, Text, VStack, Divider } from '@chakra-ui/react';

type CoursePreviewProps = {
  course: {
    subject: string;
    number: string;
    title: string;
    credits: number;
    description?: string;
    prerequisites?: string;
    termsOffered?: string[];
  } | null;
};

export default function CoursePreview({ course }: CoursePreviewProps) {
  if (!course) return null;

  return (
    <Box
      position="fixed"
      right="4"
      top="50%"
      transform="translateY(-50%)"
      width="300px"
      bg="white"
      p={4}
      borderRadius="lg"
      boxShadow="0 4px 6px rgba(212, 175, 55, 0.2)"
      border="1px"
      borderColor="gold.200"
      zIndex={100}
    >
      <VStack align="start" spacing={3}>
        <Text fontSize="xl" fontWeight="bold" color="maroon.500">
          {course.subject} {course.number}
        </Text>
        <Text fontSize="lg" fontWeight="medium">
          {course.title}
        </Text>
        <Divider />
        <Text>
          <strong>Credits:</strong> {course.credits}
        </Text>
        {course.description && (
          <Text>
            <strong>Description:</strong> {course.description}
          </Text>
        )}
        {course.prerequisites && (
          <Text>
            <strong>Prerequisites:</strong> {course.prerequisites}
          </Text>
        )}
        {course.termsOffered && course.termsOffered.length > 0 && (
          <Text>
            <strong>Terms Offered:</strong> {course.termsOffered.join(', ')}
          </Text>
        )}
      </VStack>
    </Box>
  );
} 