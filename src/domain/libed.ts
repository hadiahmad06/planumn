import type { CourseId } from "./course";
import type { Plan } from "./plan";
import { compareTerms, type TermCode } from "./terms";

/**
 * Twin Cities Liberal Education coverage (Phase B: B3). Written by Ishaan's Claude.
 *
 * Designation coverage only: which planned courses carry each Twin Cities designation. It does not
 * decide whether a requirement is met: how many themes, credit minimums, labs and the upper-division
 * WI rule depend on the student's admit term and are APAS's call (One Stop, "Liberal education
 * requirements").
 *
 * Source: the UMN catalog (CourseDog) `attributes`, e.g. "CLE - GP (Global Perspectives)". The bundled
 * catalog's Lib Ed tags mix in other campuses' and wrong designations (ECON 1101 lists Historical
 * Perspectives), so they are not used here. CourseDog reports a course's *current* designations;
 * a designation can differ by term.
 */
export type LibEdGroup = "core" | "theme" | "writing";

export interface LibEdDesignation {
  /** CourseDog CLE code. */
  code: string;
  label: string;
  group: LibEdGroup;
}

export const TWIN_CITIES_LIBED: LibEdDesignation[] = [
  { code: "AH", label: "Arts/Humanities", group: "core" },
  { code: "BIOL", label: "Biological Sciences", group: "core" },
  { code: "HIS", label: "Historical Perspectives", group: "core" },
  { code: "LITR", label: "Literature", group: "core" },
  { code: "MATH", label: "Mathematical Thinking", group: "core" },
  { code: "PHYS", label: "Physical Sciences", group: "core" },
  { code: "SOCS", label: "Social Sciences", group: "core" },
  { code: "CIV", label: "Civic Life and Ethics", group: "theme" },
  // CourseDog still codes Race, Power, and Justice as DSJ (its former name).
  { code: "DSJ", label: "Race, Power, and Justice in the United States", group: "theme" },
  { code: "ENV", label: "The Environment", group: "theme" },
  { code: "GP", label: "Global Perspectives", group: "theme" },
  { code: "TS", label: "Technology and Society", group: "theme" },
  { code: "WI", label: "Writing Intensive", group: "writing" },
];

const KNOWN = new Set(TWIN_CITIES_LIBED.map((d) => d.code));

/** "CLE - GP (Global Perspectives)" → "GP". Non-CLE attributes (e.g. "ONL - ONLINE …") are ignored. */
export function libEdCodes(attributes: unknown): string[] {
  if (!Array.isArray(attributes)) return [];
  const codes = attributes.flatMap((a) => {
    const m = typeof a === "string" ? /^CLE\s*-\s*([A-Z]+)\b/.exec(a.trim()) : null;
    return m && KNOWN.has(m[1]) ? [m[1]] : [];
  });
  return [...new Set(codes)];
}

/** Per course: its CLE codes, or null when the UMN catalog has no record of it. */
export type LibEdLookup = Record<CourseId, string[] | null | undefined>;

export interface LibEdCourse {
  courseId: CourseId;
  /** Earliest planned term (a retake is listed once). */
  term: TermCode;
}

export interface LibEdCoverage {
  designation: LibEdDesignation;
  courses: LibEdCourse[];
}

export interface LibEdResult {
  coverage: LibEdCoverage[];
  /** Planned courses still being looked up. */
  pending: number;
  /** Planned courses the UMN catalog has no record of (their designations are unknown). */
  unknown: number;
}

export function libEdCoverage(plan: Plan, lookup: LibEdLookup): LibEdResult {
  const firstTerm = new Map<CourseId, TermCode>();
  for (const s of [...plan.semesters].sort((a, b) => compareTerms(a.index, b.index)))
    for (const c of s.courses) if (!firstTerm.has(c.id)) firstTerm.set(c.id, s.index);

  let pending = 0;
  let unknown = 0;
  const known: { courseId: CourseId; term: TermCode; codes: string[] }[] = [];
  for (const [courseId, term] of firstTerm) {
    const codes = lookup[courseId];
    if (codes === undefined) pending++;
    else if (codes === null) unknown++;
    else known.push({ courseId, term, codes });
  }

  return {
    coverage: TWIN_CITIES_LIBED.map((designation) => ({
      designation,
      courses: known
        .filter((k) => k.codes.includes(designation.code))
        .map(({ courseId, term }) => ({ courseId, term })),
    })),
    pending,
    unknown,
  };
}
