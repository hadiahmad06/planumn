"use client";

import { notFound } from "next/navigation";
import { useState, useEffect } from "react";
import { Box, Flex, Text, VStack, Heading } from "@chakra-ui/react";
import PlanDisplay from "@/components/PlanDisplay";
// import { getUpdateLockHandler, getPreviewCourseHandler, usePlanMessageHandlers } from "@/handlers/planHandlers";

// temporary in-memory fake plan data
const mockPlans: Record<string, any> = {
  "abc123": {
    createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    major: ["Computer Science B.S."],
    semesters: [
      {
        index: "1249", // Fall 2024
        courses: [
          { subject: "WRIT", number: "1301" },
          { subject: "MATH", number: "1271" },
        ],
      },
      {
        index: "1253", // Spring 2025
        courses: [
          { subject: "CSCI", number: "1133" },
          { subject: "MATH", number: "1272" },
        ],
      },
      {
        index: "1255", // Summer 2025
        courses: [
          { subject: "CSCI", number: "1133" },
          { subject: "MATH", number: "1272" },
        ],
      },
      {
        index: "1259", // Fall 2026
        courses: [
          { subject: "WRIT", number: "1301" },
          { subject: "MATH", number: "1271" },
        ],
      },
      {
        index: "1263", // Spring 2026
        courses: [
          { subject: "CSCI", number: "1133" },
          { subject: "MATH", number: "1272" },
        ],
      },
      {
        index: "1265", // Summer 2026
        courses: [
          { subject: "CSCI", number: "2041" },
          { subject: "MATH", number: "2243" },
        ],
      },
      {
        index: "1269", // Fall 2026
        courses: [
          { subject: "CSCI", number: "4061" },
          { subject: "STAT", number: "3021" },
        ],
      },
      {
        index: "1273", // Spring 2027
        courses: [
          { subject: "CSCI", number: "4041" },
        ],
      },
      {
        index: "1275", // Summer 2027
        courses: [
          { subject: "CSCI", number: "5461" },
        ],
      },
      {
        index: "1279", // Fall 2027
        courses: [
          { subject: "CSCI", number: "4041" },
        ],
      },
      {
        index: "1283", // Spring 2028
        courses: [
          { subject: "CSCI", number: "5461" },
        ],
      },
      {
        index: "1285", // Summer 2028
        courses: [
          { subject: "CSCI", number: "4041" },
        ],
      },
    ],
  },
};

export default function PlanPage({ params }: { params: { planId: string } }) {
  const plan = mockPlans[params.planId];

  if (!plan) return notFound();

  const expired = Date.now() - plan.createdAt.getTime() > 1000 * 60 * 60 * 48;
  if (expired) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" textAlign="center" p={8}>
        <Box>
          <Heading size="2xl" mb={2}>Plan Expired</Heading>
          <Text color="gray.500">This graduation plan is no longer available. Create a new one to get started.</Text>
        </Box>
      </Box>
    );
  }

  const [planState, setPlanState] = useState(plan);
  // const [colorKey, setColorKey] = useState<ColorKey>('department');
  // const [courseDetails, setCourseDetails] = useState<Record<string, any>>({});

  

  // usePlanMessageHandlers(planState, setPlanState);

  // const updateLock = getUpdateLockHandler(planState, setPlanState);
  // const previewCourse = getPreviewCourseHandler();

  return (
    <PlanDisplay
      plan={planState}
      setPlan={setPlanState}
      // courseDetails={courseDetails}
      // colorKey={colorKey} // Updated to use colorKey
      // onUpdateLock={updateLock}
      // onPreviewCourse={previewCourse}
    />
  );
}