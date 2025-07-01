// this remaps all programs on addition of just one,
// not worth complicating it right now tbh

import { ProgramDetails, ReqGroup } from "./program";

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
