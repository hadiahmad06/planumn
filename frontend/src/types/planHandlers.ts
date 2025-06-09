import { PlanContext } from "@/contexts/PlanContext";
import { Course, CourseDetails, CourseStub, Semester } from "@/types/plan";
import { DialogCssVariables } from "@mantine/core";
import { useContext, useEffect } from "react";

export async function getCourseDetails(id:string) {
  const response = await fetch(`/api/courses?id=${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch course details: ${response.statusText}`);
  }
  return response.json();
}

export function updateLock(semIndex: string, j: number){
  const { plan, setPlan } = useContext(PlanContext);
  if (!plan) return;

  const updated = [...plan.semesters];
  const semIdx = updated.findIndex(s => s.index === semIndex);
  // const courseIdx = updated[semIdx].courses.findIndex(c => c.id === course.id);

  const currentLock = updated[semIdx].courses[j].lock;
  updated[semIdx].courses[j].lock =
  currentLock === "locked" ? "unlocked" : "locked";
  setPlan({ ...plan, semesters: updated });
}
