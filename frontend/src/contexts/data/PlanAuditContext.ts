"use client";

import { ProgramDetails, ProgramGroup, ReqGroup } from "@/types/program";
import { createContext } from "react";


export const PlanAuditContext = createContext<{
  dataFetched: boolean

  programIds: string[];
  setProgramIds: (programIds: string[]) => void;
  programs: Record<string, ProgramDetails>;
  setPrograms: (programs: Record<string, ProgramDetails>) => void;

  reqGroups: ReqGroup[];

  groupedPrograms: () => ProgramGroup[]
  onUpdate: () => void;

}>({
  dataFetched: false,

  programIds: [],
  setProgramIds: () => {
    console.warn("setProgramIds not implemented in context");
  },

  programs: {},
  setPrograms: () => {
    console.warn("setPrograms not implemented in context");
  },

  reqGroups: [],

  groupedPrograms: () => {
    console.warn("groupedPrograms not impletmented yet");
    return []
  },
  
  onUpdate: () => {
    console.warn("onUpdate not impelemetned in context");
  }
});
