"use client";

import { useState, useEffect, useContext } from "react";
import { useParams, notFound } from "next/navigation";
import PlanDisplay from "@/components/organisms/plan-display/PlanDisplay";
import { LockType, Plan, PlanNullable } from "@/types/plan";
import { PlanContext } from "@/contexts/PlanContext";
import { cachePlannedCourses } from "@/contexts/PlanProvider";
import OverwriteSavedPrompt from "@/components/atoms/plan-loading/OverwriteSavedPrompt";
import NoAccessPrompt from "@/components/atoms/plan-loading/NoAccessPrompt";
import UnknownErrorPrompt from "@/components/atoms/plan-loading/UnknownErrorPrompt";
import UnauthorizedPrompt from "@/components/atoms/plan-loading/UnauthorizedPrompt";
import { UserSessionContext } from "@/contexts/UserSessionContext";

export default function PlanPage() {
  const params = useParams();
  const planId = Array.isArray(params?.planId) ? params.planId[0] : params?.planId;

  const { plan, remotePlan, planFetched, setPlan, setRemotePlan, setCachedCourses } = useContext(PlanContext);
  const { user } = useContext(UserSessionContext);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [promptVisible, setPromptVisible] = useState(false);
  const [noAccessVisible, setNoAccessVisible] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const loadRemotePlan = async () => {
    if (!planId) return;
    if (!user) {
      setLoginPrompt(true);
      return;
    } else {
      setLoginPrompt(false);
    }
      
    
    // fetch by plan id
    const res = await fetch(`/api/plan?planId=${planId}`, {
      method: "GET",
      credentials: "include",
    });

    if (res.status === 401) {
      console.error("User not authenticated");
      setRemotePlan(null);
      setLoginPrompt(true);
      return;
    }

    if (res.status === 403) {
      console.error("Access denied: You do not have permission to view this plan.");
      setRemotePlan(null);
      setNoAccessVisible(true);
      return;
    }

    if (!res.ok) {
      console.error("Plan fetch failed:", await res.text());
      setRemotePlan(null);
      setLoadFailed(true);
      return;
    }

    const { plan: data } = await res.json();

    if (!data) {
      setRemotePlan(null);
      return;
    }

    const remotePlan: Plan = {
      id: data.id,
      created_at: new Date(data.created_at),
      last_updated: new Date(data.last_updated),
      deletion_scheduled_at: data.deletion_scheduled_at,
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

    // setPlan(remotePlan);
    setRemotePlan(JSON.parse(JSON.stringify(remotePlan)) as PlanNullable);
    cachePlannedCourses(remotePlan, setCachedCourses);

    return remotePlan;
  };

  useEffect(() => {
    if (!planFetched) return;
    if (!plan) {
      loadRemotePlan().then((remotePlan) => { if(remotePlan) setPlan(remotePlan)});
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
  }, [planFetched, planId, user]);

  if (!planId) return notFound();

  // if (loginPrompt) {
  //   return (
  //     <UnauthorizedPrompt/>
  //   )
  // }

  // if (noAccessVisible) {
  //   return (
  //     <NoAccessPrompt/>
  //   )
  // }

  // if (loadFailed) {
  //   return (
  //     <UnknownErrorPrompt/>
  //   )
  // }

  // if (promptVisible) {
  //   return (
  //     <OverwriteSavedPrompt
  //       setPromptVisible={setPromptVisible}
  //       onOverwrite={() => {
  //         setPromptVisible(false);
  //         loadRemotePlan().then((remotePlan) => { if(remotePlan) setPlan(remotePlan)});
  //       }}
  //       message="An autosave was found for a different plan. Overwrite and load this plan?"
  //     />
  //   );
  // }

  return (
    <>
      <PlanDisplay />
      <div 
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%"
        }}
      >
        {loginPrompt ? (
          <UnauthorizedPrompt />
        ) : noAccessVisible ? (
          <NoAccessPrompt />
        ) : loadFailed ? (
          <UnknownErrorPrompt />
        ) : promptVisible ? (
          <OverwriteSavedPrompt
            setPromptVisible={setPromptVisible}
            onOverwrite={() => {
              setPromptVisible(false);
              loadRemotePlan().then((remotePlan) => {
                if (remotePlan) setPlan(remotePlan);
              });
            }}
            message="An autosave was found for a different plan. Overwrite and load this plan?"
          />
        ) : null}
      </div>
    </>
  );
}