"use client";

import { CourseDetails } from "@/types/plan";
import { ProgramDetails, ProgramGroup, ReqGroup } from "@/types/program";
import { createContext } from "react";


export const PlanAuditContext = createContext<{
  dataFetched: boolean
  cachedReqCourses: Record<string, CourseDetails>;

  programIds: string[];
  setProgramIds: (programIds: string[]) => void;
  programs: Record<string, ProgramDetails>;
  setPrograms: (programs: Record<string, ProgramDetails>) => void;

  reqGroups: Record<string, ReqGroup[]>;

  groupedPrograms: () => ProgramGroup[]
  onUpdate: () => void;

}>({
  dataFetched: false,
  cachedReqCourses: {},

  programIds: [],
  setProgramIds: () => {
    console.warn("setProgramIds not implemented in context");
  },

  programs: {},
  setPrograms: () => {
    console.warn("setPrograms not implemented in context");
  },

  reqGroups: {},

  groupedPrograms: () => {
    console.warn("groupedPrograms not impletmented yet");
    return []
  },
  
  onUpdate: () => {
    console.warn("onUpdate not impelemetned in context");
  }
});
