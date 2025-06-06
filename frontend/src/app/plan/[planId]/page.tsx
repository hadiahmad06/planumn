"use client";

import { Box, Text, Title, Container } from "@mantine/core";
import { useState, useEffect, useContext } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { supabase } from "@/lib/supabase";
import { useParams, notFound } from "next/navigation";
import PlanDisplay from "@/components/organisms/PlanDisplay";
import { LockType, Plan } from "@/types/plan";
// import { getPlanDetails } from "@/types/planHandlers";
import { PlanContext } from "@/contexts/PlanContext";

export default function PlanPage() {
  const params = useParams();
  const planId = Array.isArray(params?.planId) ? params.planId[0] : params?.planId;

  const { plan, setPlan } = useContext(PlanContext);
  const [isExpired, setIsExpired] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const supabaseClient = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    supabaseClient.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
    });
  }, []);

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
        createdAt: new Date(data.created_at),
        major: data.major,
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

      const expired = Date.now() - plan.createdAt.getTime() > 1000 * 60 * 60 * 48;
      setIsExpired(expired);

      // const planDetails = await getPlanDetails(plan);
      setPlan(plan);
    };

    fetchPlan();
  }, [planId]);

  useEffect(() => {
    if (!plan || !user || plan.user_id !== user.id) return;

    const updatePlan = async () => {
      const { error } = await supabase
        .from("plans")
        .update({
          major: plan.major,
          semesters: plan.semesters,
        })
        .eq("id", plan.id);

      if (error) {
        console.error("Failed to sync plan to Supabase:", error);
      } else {
        console.log("Plan synced successfully");
      }
    };

    updatePlan();
  }, [plan, user]);

  if (!planId) return notFound();

  if (!plan) {
    return (
      <Box
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <Text>Loading...</Text>
      </Box>
    );
  }

  return (
    <PlanDisplay/>
  );
}