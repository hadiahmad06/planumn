import type { CourseId } from "./course";
import { TWIN_CITIES_LIBED, type LibEdLookup } from "./libed";
import { listedCourseIds, type ProgramResult } from "./requirements";

/**
 * Double-dip finder (Phase B: B12). Written by Hadi's Claude.
 *
 * Unplanned courses that would count toward two or more unfinished things at once: unsatisfied program
 * requirements (any of the plan's majors and minors) and Twin Cities Lib Ed designations the plan doesn't
 * cover yet. Requirements that count 0 units (e.g. "up to 22 elective credits") are left out, matching
 * how progress counts them today (a Phase Y question). Lib Ed "covered" means at least one planned course
 * or slot, the same coverage-only view as B3; whether a theme or core is complete is APAS's call.
 */
export type DipTarget =
  | { kind: "requirement"; programId: string; programName: string; requirementId: string; name: string }
  | { kind: "libed"; code: string; label: string };

export interface DoubleDip {
  courseId: CourseId;
  targets: DipTarget[];
}

export interface DoubleDipInput {
  results: ProgramResult[];
  /** Every course already in the plan. */
  planned: ReadonlySet<CourseId>;
  /** Lib Ed codes per course (undefined = not loaded yet, null = not in the UMN catalog). */
  libEd: LibEdLookup;
  /** Designations the plan already covers. */
  coveredLibEd: ReadonlySet<string>;
}

export interface DoubleDipResult {
  dips: DoubleDip[];
  /** Courses that count toward one requirement and whose Lib Ed designations are still loading. */
  pending: number;
}

/** Candidate courses: everything an unsatisfied requirement lists that isn't planned yet. */
export function doubleDipCandidates(results: ProgramResult[], planned: ReadonlySet<CourseId>): CourseId[] {
  const ids = new Set<CourseId>();
  for (const p of results)
    for (const r of p.requirements)
      if (!r.satisfied && r.units > 0) for (const rule of r.requirement.rules) for (const id of listedCourseIds(rule)) if (!planned.has(id)) ids.add(id);
  return [...ids];
}

export function findDoubleDips({ results, planned, libEd, coveredLibEd }: DoubleDipInput): DoubleDipResult {
  const targets = new Map<CourseId, DipTarget[]>();
  for (const p of results)
    for (const r of p.requirements) {
      if (r.satisfied || r.units === 0) continue;
      const ids = new Set(r.requirement.rules.flatMap(listedCourseIds));
      for (const id of ids) {
        if (planned.has(id)) continue;
        const list = targets.get(id) ?? [];
        list.push({ kind: "requirement", programId: p.program.id, programName: p.program.name, requirementId: r.requirement.id, name: r.requirement.name });
        targets.set(id, list);
      }
    }

  let pending = 0;
  const dips: DoubleDip[] = [];
  for (const [courseId, reqs] of targets) {
    const codes = libEd[courseId];
    if (codes === undefined && reqs.length < 2) pending++;
    const libEdTargets: DipTarget[] = TWIN_CITIES_LIBED.filter((d) => codes?.includes(d.code) && !coveredLibEd.has(d.code)).map((d) => ({
      kind: "libed",
      code: d.code,
      label: d.label,
    }));
    const all = [...reqs, ...libEdTargets];
    if (all.length >= 2) dips.push({ courseId, targets: all });
  }

  // Most targets first; then courses mixing programs and Lib Ed; then a stable id order.
  const mixes = (d: DoubleDip) => (d.targets.some((t) => t.kind === "libed") && d.targets.some((t) => t.kind === "requirement") ? 1 : 0);
  dips.sort((a, b) => b.targets.length - a.targets.length || mixes(b) - mixes(a) || a.courseId - b.courseId);
  return { dips, pending };
}
