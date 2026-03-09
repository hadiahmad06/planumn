"use client";

import { useContext, useEffect, useState } from "react";
import { PlanAuditContext } from "./PlanAuditContext";
import { ProgramDetails, ReqGroup } from "@/types/program";
import { getCourseIdsFromPrograms, uniqueReqGroups } from "@/types/programHandlers";
import { CourseDetails, PlanNullable } from "@/types/plan";
import { get } from "http";
import { fetchCourseDetailsFromCd } from "@/types/planHandlers";
import { PlanContext } from "./PlanContext";
import { set } from "date-fns";
import { calculateAllRequirementsCompletion, findCourseAlternatives } from "@/types/requirement";

export const PlanAuditProvider = ({ children }: { children: React.ReactNode }) => {
  const { plan, setPlan, planFetched } = useContext(PlanContext);

  const [dataFetched, setDataFetched] = useState<boolean>(false);
  const [cachedReqCourses, setCachedReqCourses] = useState<Record<string, CourseDetails>>({});

  const [programIds, setProgramIds] = useState<string[]>([]);
  const [programs, setPrograms] = useState<Record<string, ProgramDetails>>({});

  const [reqGroups, setReqGroups] = useState<Record<string, ReqGroup[]>>({});
  const [requirementCompletion, setRequirementCompletion] = useState<Record<string, any>>({});
  const [courseAlternatives, setCourseAlternatives] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!planFetched) return;
    if (!plan || !plan.programs || plan.programs.length === 0) setProgramIds([]);
    else setProgramIds(plan.programs.map((p) => p));
    updateProgramList();
  }, [planFetched]);

  useEffect(() => {
    if (reqGroups && Object.keys(reqGroups).length > 0) {
      const completion = calculateAllRequirementsCompletion(reqGroups, plan, cachedReqCourses);
      setRequirementCompletion(completion);

      const alternatives: Record<string, any> = {};
      for (const [key, groups] of Object.entries(reqGroups)) {
        for (const group of groups) {
          alternatives[group.id] = findCourseAlternatives(group, plan, cachedReqCourses);
        }
      }
      setCourseAlternatives(alternatives);
    }
  }, [plan, reqGroups]);

  const updateProgramList = async () => {

    if (!programIds || programIds.length === 0) return;

    console.log("update program list");

    if (plan) {
      setPlan({
        ...plan,
        programs: programIds,
      });
    }

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
      setReqGroups((_) => {
        const updated = {"requisitesSimple":uniqueReqGroups(Object.values(programMap))};
        // const merged: Record<string, ReqGroup[]> = {};

        // for (const key of Object.keys(prev)) {
        //   merged[key] = updated[key] ?? prev[key];
        // }

        // for (const key of Object.keys(updated)) {
        //   if (!(key in merged)) merged[key] = updated[key];
        // }

        return updated;
        // return merged;
      });

      setCachedReqCourses(
        await fetchCourseDetailsFromCd(
          getCourseIdsFromPrograms(Object.values(programMap))
        )
      );
      // console.log("Fetched course details for programs:",
      //   await fetchCourseDetailsFromCd(
      //     getCourseIdsFromPrograms(Object.values(programMap))
      //   ));


    } catch (error) {
      console.error("Error fetching program data:", error);
    }
  };

return (
    <PlanAuditContext.Provider
      value={{
        dataFetched: dataFetched,
        cachedReqCourses: cachedReqCourses,
        programIds: programIds,
        setProgramIds: setProgramIds,
        programs: programs,
        setPrograms: setPrograms,
        reqGroups: reqGroups,
        requirementCompletion: requirementCompletion,
        courseAlternatives: courseAlternatives,
        groupedPrograms: () => {return []},
        onUpdate: updateProgramList
      }}
    >
      {children}
    </PlanAuditContext.Provider>
  );
}