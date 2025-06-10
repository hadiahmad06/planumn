"use client";

import { Box, Text, Title, Container } from "@mantine/core";
import { useState, useEffect, useContext } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { supabase } from "@/lib/supabase";
import { useParams, notFound } from "next/navigation";
import PlanDisplay from "@/components/organisms/PlanDisplay";
import { LockType, Plan, PlanNullable } from "@/types/plan";
// import { getPlanDetails } from "@/types/planHandlers";
import { PlanContext } from "@/contexts/PlanContext";
import { cachePlannedCourses } from "@/contexts/PlanProvider";

export default function PlanPage() {
  const params = useParams();
  const planId = Array.isArray(params?.planId) ? params.planId[0] : params?.planId;

  const { setPlan, setRemotePlan, setCachedCourses } = useContext(PlanContext);
  const [user, setUser] = useState<any>(null);

  // useEffect(() => {
  //   const supabaseClient = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  //   supabaseClient.auth.getUser().then(({ data }) => {
  //     setUser(data?.user ?? null);
  //   });
  // }, []);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!planId) return;

      console.log("Fetching plan with ID:", planId);
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("id", planId)
        .single();

      if (error || !data) {
        console.error("Plan fetch error:", error);
        setPlan(null);
        return;
      }

      const plan: Plan = {
        id: data.id,
        created_at: new Date(data.created_at),
        last_updated: new Date(data.last_updated),
        can_view: data.can_view,
        title: data.title,
        programs: data.programs,
        semesters: data.semesters.map((semester: any) => ({
          ...semester,
          courses: semester.courses.map((course: any) => ({
            ...course,
            lock: (["locked", "unlocked", "autofilled"].includes(course.lock)
              ? course.lock
              : "unlocked") as LockType,
          })),
        })),
        user_id: data.user_id,
      };

      // const expired = Date.now() - plan.created_at.getTime() > 1000 * 60 * 60 * 48;
      // setIsExpired(expired);

      // const planDetails = await getPlanDetails(plan);
      setPlan(plan);
      setRemotePlan(JSON.parse(JSON.stringify(plan)) as PlanNullable);
      cachePlannedCourses(plan, setCachedCourses);
    };

    fetchPlan();
  }, [planId]);

  if (!planId) return notFound();

  // if (!plan) {
  //   return (
  //     <Box
  //       style={{
  //         minHeight: "100vh",
  //         display: "flex",
  //         alignItems: "center",
  //         justifyContent: "center",
  //         textAlign: "center",
  //       }}
  //     >
  //       <Text>Loading...</Text>
  //     </Box>
  //   );
  // }

  return (
    <PlanDisplay/>
  );
}