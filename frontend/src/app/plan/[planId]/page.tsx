"use client";

import { useParams, notFound } from "next/navigation";
import { useState, useEffect } from "react";
import { Box, Flex, Text, VStack, Heading } from "@chakra-ui/react";
import PlanDisplay from "@/components/PlanDisplay";
import mockPlans from "./mockPlans.json";

// import { getUpdateLockHandler, getPreviewCourseHandler, usePlanMessageHandlers } from "@/handlers/planHandlers";

// temporary in-memory fake plan data
const plans: Record<string, any> = mockPlans;

export default function PlanPage() {
  const params = useParams();
  const planId = Array.isArray(params?.planId) ? params.planId[0] : params?.planId; 
  
  if (!planId || !plans[planId]) {
    return notFound();
  }
  
  const plan = plans[planId];

  plan.createdAt = new Date(plan.createdAt);
  const expired = Date.now() - plan.createdAt.getTime() > 1000 * 60 * 60 * 48;

  // Keep this commented out for now, as we are not handling expired plans yet
  // Uncomment this block when you want to handle expired plans
  // if (expired) {
  //   return (
  //     <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" textAlign="center" p={8}>
  //       <Box>
  //         <Heading size="2xl" mb={2}>Plan Expired</Heading>
  //         <Text color="gray.500">This graduation plan is no longer available. Create a new one to get started.</Text>
  //       </Box>
  //     </Box>
  //   );
  // }

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