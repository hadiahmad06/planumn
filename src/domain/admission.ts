import type { CourseId } from "./course";
import { isPriorCredit, type Semester } from "./plan";
import type { ProgramResult, RequirementResult } from "./requirements";
import { compareTerms, type TermCode } from "./terms";

/**
 * Admission-to-major checklists (B26). The courses come from CourseDog's own "Program Admission
 * Requirements" level (CSE, Carlson, Nursing majors), not from a hand-written list, so there is no
 * planu.mn rule here: the checklist only says which of those requirements the plan covers and when.
 * It can't check grades (C- minimums), the technical GPA, or application deadlines; the UI says so.
 */

export interface AdmissionItem {
  result: RequirementResult;
  /** The latest term holding a course this requirement counts, or "prior" for AP/IB/transfer only. */
  plannedBy: TermCode | "prior" | null;
}

export interface AdmissionChecklist {
  programId: string;
  items: AdmissionItem[];
  /** The catalog's admission text and links, shown as written. */
  notes: string | null;
  links: { label: string; url: string }[];
  met: number;
  /** When every item is covered: the latest term among them. */
  plannedBy: TermCode | "prior" | null;
}

/** First term each planned course appears in; the prior-credit bucket is "prior". */
function firstTerms(semesters: Semester[]): Map<CourseId, TermCode | "prior"> {
  const out = new Map<CourseId, TermCode | "prior">();
  const sorted = [...semesters].sort((a, b) => compareTerms(a.index, b.index));
  for (const s of sorted) for (const c of s.courses) if (!out.has(c.id)) out.set(c.id, isPriorCredit(s) ? "prior" : s.index);
  return out;
}

function latest(terms: (TermCode | "prior")[]): TermCode | "prior" | null {
  if (terms.length === 0) return null;
  const real = terms.filter((t): t is TermCode => t !== "prior");
  return real.length ? real.sort(compareTerms)[real.length - 1] : "prior";
}

/** Null when the program has no admission requirements and no admission text. */
export function admissionChecklist(result: ProgramResult, semesters: Semester[]): AdmissionChecklist | null {
  const admission = result.requirements.filter((r) => r.requirement.level === "admission");
  const notes = result.program.admissionNotes ?? null;
  if (admission.length === 0 && !notes) return null;
  const terms = firstTerms(semesters);
  const items = admission.map((r) => ({
    result: r,
    plannedBy: r.satisfied ? latest(r.courseIds.flatMap((id) => terms.get(id) ?? [])) : null,
  }));
  const met = items.filter((i) => i.result.satisfied).length;
  return {
    programId: result.program.id,
    items,
    notes,
    links: result.program.admissionLinks ?? [],
    met,
    plannedBy: items.length > 0 && met === items.length ? latest(items.flatMap((i) => (i.plannedBy ? [i.plannedBy] : []))) : null,
  };
}
