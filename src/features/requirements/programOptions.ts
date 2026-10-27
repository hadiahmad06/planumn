import options from "./programOptions.json";

/**
 * Undergraduate majors and minors (CourseDog program group ids), from the 2026 AI_Advisor branch's
 * programOptions.json filtered to B.* degrees and minors.
 */
export interface ProgramOption {
  id: string;
  name: string;
}

export const PROGRAM_OPTIONS: ProgramOption[] = options;
const byId = new Map(PROGRAM_OPTIONS.map((o) => [o.id, o]));

export function programName(id: string): string {
  return byId.get(id)?.name ?? id;
}

export function searchPrograms(query: string, limit = 40): ProgramOption[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const hits = words.length ? PROGRAM_OPTIONS.filter((o) => words.every((w) => o.name.toLowerCase().includes(w))) : PROGRAM_OPTIONS;
  return hits.slice(0, limit);
}
