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
import OverwriteSavedPrompt from "@/components/atoms/OverwriteSavedPrompt";

export default function PlanPage() {
  const params = useParams();
  const planId = Array.isArray(params?.planId) ? params.planId[0] : params?.planId;

  const { plan, planFetched, setPlan, setRemotePlan, setCachedCourses } = useContext(PlanContext);
  const [promptVisible, setPromptVisible] = useState(false);

  const loadRemotePlan = async () => {
    if (!planId) return;

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

    const remotePlan: Plan = {
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

    setPlan(remotePlan);
    setRemotePlan(JSON.parse(JSON.stringify(remotePlan)) as PlanNullable);
    cachePlannedCourses(remotePlan, setCachedCourses);

    return remotePlan;
  };

  useEffect(() => {
    if (!planFetched) return;
    if (!plan) {
      loadRemotePlan();
    } else if (plan.id === planId) {
      loadRemotePlan().then((remotePlan) => {
        // in the case that we used router.replace this shouldnt do anything since its the same last_updated value
        if (remotePlan && remotePlan.last_updated > plan.last_updated) {
          setPlan(remotePlan);
        }
      });
    } else {
      setPromptVisible(true);
    }
  }, [planFetched, planId]);

  if (!planId) return notFound();

  if (promptVisible) {
    return (
      <OverwriteSavedPrompt
        setPromptVisible={setPromptVisible}
        onOverwrite={() => {
          setPromptVisible(false);
          loadRemotePlan();
        }}
        message="An autosave was found for a different plan. Overwrite and load this plan?"
      />
    );
  }

  return (
    <PlanDisplay/>
  );
}