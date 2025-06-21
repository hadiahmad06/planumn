"use client";

import { useContext, useEffect, useState } from "react";
import PlanDisplay from "@/components/organisms/plan-display/PlanDisplay";
import { Plan, PlanNullable, Semester } from "@/types/plan";
import { PlanContext } from "@/contexts/PlanContext";
import { Skeleton } from "@mantine/core";
import OverwriteSavedPrompt from "@/components/atoms/OverwriteSavedPrompt";

// Create a new empty plan
const createEmptyPlan = (): PlanNullable => {
  const currentYear = new Date().getFullYear();
  const semesters: Semester[] = [];
  
  // Create 12 semesters (4 years)
  for (let i = 0; i < 12; i++) {
    const baseYear = Math.floor(i / 3) + currentYear;
    const year = i % 3 === 0 ? baseYear : baseYear + 1; // We start with Fall of the current year
    const season = i % 3 === 0 ? '9' : i % 3 === 1 ? '3' : '5'; // 9=Fall, 3=Spring, 5=Summer
    semesters.push({
      index: `1${year.toString().slice(2)}${season}`,
      courses: []
    });
  }
  
  console.log("Created empty plan with semesters:", semesters);
  return {
    id: null,
    user_id: null,
    created_at: new Date(),
    last_updated: new Date(),
    deletion_scheduled_at: null,
    can_view: [],
    title: "",
    programs: [],
    semesters: semesters
  };
};

export default function NewPlanPage() {
  const [promptVisible, setPromptVisible] = useState(true);
  const { setPlan, setRemotePlan } = useContext(PlanContext);

  // logic behind checking if plan already exists is in child component
  return promptVisible ? 
    <OverwriteSavedPrompt
      setPromptVisible={setPromptVisible}
      onOverwrite={() => { setPlan(createEmptyPlan()); setRemotePlan(null); }}
      message="An autosave was found. Continuing wil replace it with an empty plan."
      /> 
      : <PlanDisplay/>;
}
