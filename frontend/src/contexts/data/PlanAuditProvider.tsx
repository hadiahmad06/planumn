"use client";

import { useState } from "react";
import { PlanAuditContext } from "./PlanAuditContext";
import { ProgramDetails, ReqGroup } from "@/types/program";
import { uniqueReqGroups } from "@/types/programHandlers";

export const PlanAuditProvider = ({ children }: { children: React.ReactNode }) => {
  const [dataFetched, setDataFetched] = useState<boolean>(false);

  const [programIds, setProgramIds] = useState<string[]>([]);
  const [programs, setPrograms] = useState<Record<string, ProgramDetails>>({});

  const [reqGroups, setReqGroups] = useState<ReqGroup[]>([]);

  const updateProgramList = async () => {

    if (!programIds || programIds.length === 0) return;

    console.log("update program list");

    try {
      const response = await fetch('/api/programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ programGroupIds: programIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch program data');
      }

      const raw = await response.json();
      const programMap: Record<string, ProgramDetails> = {};

      for (const entry of raw.data) {
        const [id, details] = Object.entries(entry)[0];
        programMap[id] = details as ProgramDetails;
      }

      // console.log("Fetched program data");
      console.log("programMap:", programMap);
      setPrograms(programMap);
      setReqGroups(uniqueReqGroups(Object.values(programMap)));


    } catch (error) {
      console.error("Error fetching program data:", error);
    }
  };

  return (
    <PlanAuditContext.Provider
      value={{
        dataFetched: dataFetched,
        programIds: programIds,
        setProgramIds: setProgramIds,
        programs: programs,
        setPrograms: setPrograms,
        reqGroups: reqGroups,
        groupedPrograms: () => {return []},
        onUpdate: updateProgramList
      }}
    >
      {children}
    </PlanAuditContext.Provider>
  );
}