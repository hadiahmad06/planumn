import { toTermCode, type Season, type TermCode } from "./terms";

/**
 * A parsed UMN APAS audit (B1 step 2). Written by Hadi's Claude from real uAchieve 5.2 HTML reports
 * (CS B.S. and EE B.E.E., 2026-10-27). The DOM parser is `src/features/apas/parseReport.ts`; this file
 * holds the shape and the pure conversions, so they can be tested without a DOM.
 *
 * Deliberately not kept: the student ID, name and advisors that the report also shows.
 */

export type ApasStatus = "complete" | "in-progress" | "incomplete" | "none";

/** What a course row means for planning. */
export type ApasCourseKind =
  | "completed" // UMN course with a final grade (F included: see `earnedCredit`)
  | "in-progress" // registered this term (condition code IP, or a grading basis such as AF/SN as grade)
  | "planned" // future-term registration (condition code FT)
  | "exam" // AP/IB/CLEP credit: grade T, T3–T5 with an "… EXAM" line
  | "transfer" // transfer credit: grade T without an exam line
  | "withdrawn" // W
  | "no-credit"; // 0 credits otherwise (e.g. an AP score that earned nothing: N2)

export interface ApasCourse {
  term: TermCode | null;
  /** As printed: "SP21", "F 22". */
  termRaw: string;
  /** "CSCI 1001", "EE 3101". Without the campus digit. */
  code: string;
  /** UMN campus digit from the report ("1" = Twin Cities). */
  campus: string;
  credits: number;
  grade: string;
  /** Condition code column: "IP", "FT", ">D", ">R", or "". */
  condition: string;
  kind: ApasCourseKind;
  /** Counts toward credits earned (not W, not F/N, not 0 credits, not in progress). */
  earnedCredit: boolean;
  title: string;
  /** Extra description lines, e.g. "AP EXAM: CSCIP" or the transfer school's course. */
  notes: string[];
}

export interface ApasNeeds {
  credits: number | null;
  courses: number | null;
  /** "group(s)" (e.g. Lib Ed themes). */
  groups: number | null;
  /** Requirement totals only: how many of its sub-requirements are still needed. */
  subrequirements: number | null;
}

export interface ApasSubrequirement {
  title: string;
  status: ApasStatus;
  /** "R": mandatory within a list of choices. */
  required: boolean;
  needs: ApasNeeds | null;
  /** Courses the audit applied here ("CSCI 4041"). */
  courses: string[];
  /** "Select from" options: "CSCI 4011", or wildcards "CSCI 4***", "EE *****". */
  options: string[];
}

export interface ApasRequirement {
  /** uAchieve requirement name ("CSCITELEC"). */
  id: string;
  title: string;
  status: ApasStatus;
  earned: { credits: number | null; courses: number | null };
  inProgress: { credits: number | null; courses: number | null };
  needs: ApasNeeds | null;
  subrequirements: ApasSubrequirement[];
}

export interface ApasAudit {
  program: { code: string; title: string };
  catalogTerm: TermCode | null;
  /** As printed: "10/27/2026 02:02 PM". */
  preparedOn: string | null;
  expectedGradTerm: TermCode | null;
  /** The report's own banner ("At least one requirement is not complete."). */
  complete: boolean;
  /** Every course row, once each (the report repeats a course under every requirement it counts for). */
  courses: ApasCourse[];
  requirements: ApasRequirement[];
}

const SEASONS: Record<string, Season> = { SP: "spring", S: "spring", SPR: "spring", SU: "summer", SUM: "summer", F: "fall", FA: "fall", FALL: "fall" };

/** "SP21", "F 22", "SU25" → term code. Null when the shape is unknown. */
export function parseApasTerm(raw: string): TermCode | null {
  const m = raw.trim().toUpperCase().match(/^([A-Z]+)\s*(\d{2})$/);
  const season = m && SEASONS[m[1]];
  return season ? toTermCode({ year: 2000 + Number(m[2]), season }) : null;
}

/** "Fall 2024", "Spr 2028", "Summer 2025" → term code. */
export function parseApasTermLabel(raw: string): TermCode | null {
  const m = raw.trim().toUpperCase().match(/^([A-Z]+)\.?\s+(\d{4})$/);
  if (!m) return null;
  const season = SEASONS[m[1]] ?? (m[1].startsWith("SPR") ? "spring" : m[1].startsWith("SUM") ? "summer" : m[1].startsWith("FAL") ? "fall" : null);
  return season ? toTermCode({ year: Number(m[2]), season }) : null;
}

/** uAchieve "yyyyt" (`catlyt="20249"`): t is 3/5/9 like our term codes. */
export function parseUachieveTerm(raw: string): TermCode | null {
  const m = raw.trim().match(/^(\d{4})([359])$/);
  return m ? `1${m[1].slice(2)}${m[2]}` : null;
}

/**
 * "1CSCI1001" / "1EE  3101" / "1MATH1271H" → campus + "CSCI 1001". The subject is padded to 4
 * characters; the number is whatever follows (4 digits and an optional suffix, or a wildcard).
 */
export function parseApasCourseCode(raw: string): { campus: string; code: string } | null {
  const s = raw.replace(/ /g, " ");
  const m = s.match(/^\s*(\d)([A-Z][A-Z ]{0,3}?)\s*([0-9*][0-9A-Z*]*)\s*$/);
  if (!m) return null;
  return { campus: m[1], code: `${m[2].trim()} ${m[3]}` };
}

/** A "select from" option: department attribute "1EE  " + number "4161 " → "EE 4161". */
export function apasOption(department: string, number: string): string | null {
  const dept = department.trim().replace(/^\d/, "").trim();
  const num = number.trim();
  return dept && num ? `${dept} ${num}` : null;
}

const GRADING_BASES = new Set(["AF", "SN", "OPT", "AUD"]);

/** Decide what a course row means (rules documented in docs/agent/heuristics.md §1). */
export function classifyApasCourse(row: { grade: string; condition: string; credits: number; notes: string[] }): {
  kind: ApasCourseKind;
  earnedCredit: boolean;
} {
  const grade = row.grade.trim().toUpperCase();
  const condition = row.condition.trim().toUpperCase();
  const exam = row.notes.some((n) => /\bEXAM\b/i.test(n));
  let kind: ApasCourseKind;
  if (condition === "IP" || (GRADING_BASES.has(grade) && condition !== "FT")) kind = "in-progress";
  else if (condition === "FT") kind = "planned";
  else if (grade === "W") kind = "withdrawn";
  else if (/^T\d?$/.test(grade)) kind = row.credits > 0 ? (exam ? "exam" : "transfer") : "no-credit";
  else if (row.credits <= 0) kind = "no-credit";
  else kind = "completed";
  const failed = grade === "F" || grade === "N";
  return { kind, earnedCredit: (kind === "completed" || kind === "exam" || kind === "transfer") && !failed && row.credits > 0 };
}
