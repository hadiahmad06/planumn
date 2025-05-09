import { Box, Text } from "@chakra-ui/react";

type Props = {
  course: {
    subject: string;
    number: string;
    title: string;
    credits: number;
    lock?: string;
  };
};

export default function CourseCardPreview({ course }: Props) {
  return (
    <Box
      position="absolute"
      zIndex={50}
      display="none"
      _groupHover={{ display: "block" }}
      _groupFocus={{ display: "block" }}
      left="full"
      ml={2}
      width={64}
      p={2}
      fontSize="xs"
      color="black"
      bg="white"
      border="1px"
      rounded="md"
      shadow="lg"
      transition="opacity 0.2s"
      transitionDelay="500ms"
      _groupHover={{ transitionDelay: "500ms" }}
    >
      <Text fontWeight="bold">{course.title}</Text>
      <Text>Credits: {course.credits}</Text>
      <Text fontStyle="italic" color="gray.500" mt={1}>Prereqs: TBD</Text>
      {course.lock && (
        <Text mt={1} fontSize="xs" fontWeight="semibold">Lock: {course.lock}</Text>
      )}
    </Box>
  );
} 