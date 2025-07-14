"use client";

import { useState, useEffect, useContext } from "react";
import { createClient } from "@/utils/supabase/client";
import { useParams, notFound } from "next/navigation";
import PlanDisplayDesktop from "@/components/organisms/plan-display/PlanDisplayDesktop";
import { LockType, Plan, PlanNullable } from "@/types/plan";
import { PlanContext } from "@/contexts/data/PlanContext";
import { cachePlannedCourses } from "@/contexts/data/PlanProvider";
import OverwriteSavedPrompt from "@/components/atoms/OverwriteSavedPrompt";
import {MobileContext} from "@/contexts/visual/MobileContext";
import PlanDisplayMobile from "@/components/organisms/plan-display/PlanDisplayMobile";

export default function PlanPage() {
  const params = useParams();
  const planId = Array.isArray(params?.planId) ? params.planId[0] : params?.planId;

  const { plan, planFetched, setPlan, setRemotePlan, setCachedCourses } = useContext(PlanContext);
  const [promptVisible, setPromptVisible] = useState(false);

  const loadRemotePlan = async () => {
    if (!planId) return;
    const supabase = createClient();
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
      deletion_scheduled_at: null,
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

  const { isMobile } = useContext(MobileContext);
  return isMobile ? <PlanDisplayMobile /> : <PlanDisplayDesktop />;
}