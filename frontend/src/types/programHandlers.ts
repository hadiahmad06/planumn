// this remaps all programs on addition of just one,
// not worth complicating it right now tbh

import { ProgramDetails, ReqGroup, ReqValue } from "./program";

export function uniqueReqGroups(programs: ProgramDetails[]): ReqGroup[] {
  const groupMap = new Map<string, ReqGroup>();

  for (const program of programs) {
    if (!program.requisites) continue;

    for (const group of program.requisites["requisitesSimple"] ) {
      if (!groupMap.has(group.id)) {
        groupMap.set(group.id, group);
      }
    }
  }
  console.log(groupMap);
  return Array.from(groupMap.values());
}

// idk if this works i havent tested
export function getCourseIdsFromPrograms(programs: ProgramDetails[]): string[] {
  const courseIds = new Set<string>();

  for (const program of programs) {
    if (!program.requisites) continue;

    for (const group of program.requisites["requisitesSimple"]) {
      for (const rule of group.rules) {
        if (rule.value && rule.value.values) {
          (rule.value.values.forEach((val: ReqValue) => {
            (val.value.forEach((code: string) => {
              courseIds.add(code);
            }))
          }))
        }
      }
    }
  }

  return Array.from(courseIds);
}