"use client";

import { useParams, notFound } from "next/navigation";
import { useState, useEffect } from "react";
import { Box, Flex, Text, VStack, Heading } from "@chakra-ui/react";
import PlanDisplay from "@/components/organisms/PlanDisplay";
import mockPlans from "./mockPlans.json";
import { LockType, Plan, PlanDetails, Semester } from "@/types/plan";
import { getPlanDetails } from "@/types/planHandlers";

// import { getUpdateLockHandler, getPreviewCourseHandler, usePlanMessageHandlers } from "@/handlers/planHandlers";

// temporary in-memory fake plan data
const plans: Record<string, Plan> = Object.fromEntries(
  Object.entries(mockPlans).map(([key, plan]) => [
    key,
    {
      ...plan,
      createdAt: new Date(plan.createdAt), // Convert createdAt to Date
      semesters: plan.semesters.map((semester) => ({
        ...semester,
        courses: semester.courses.map((course) => ({
          ...course,
          lock: (["locked", "unlocked", "autofilled"].includes(course.lock)
            ? course.lock
            : "unlocked") as LockType, // Ensure correct type
        })),
      })),
    },
  ])
);

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

  const [planState, setPlanState] = useState<PlanDetails | null>(null);


  useEffect(() => {
    const fetchPlanDetails = async () => {
      const planDetails = await getPlanDetails(plan); // Await the async function
      setPlanState(planDetails); // Update state with the fetched details
    };

    fetchPlanDetails();
  }, [plan]);

  if (!planState) {
    // Show a loading state while the plan details are being fetched
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" textAlign="center">
        <Text>Loading...</Text>
      </Box>
    );
  }

  return (
    <PlanDisplay
      plan={planState}
      setPlan={setPlanState}
    />
  );
}