import { equivalentCodes, type CourseId } from "./course";
import type { Plan } from "./plan";
import { parsePrereqs, type PrereqNode } from "./prereqs";
import { compareTerms, type TermCode } from "./terms";

/**
 * Prerequisite "unlocks" graph and critical path (Phase B: B22). Written by Ishaan's Claude.
 *
 * Edge A → B when B is planned in a later term than A and B's catalog prerequisite text names A
 * (honors versions count as the base course). The critical path is the longest such chain in the plan:
 * delaying any course on it pushes every course after it back. Prerequisite text is parsed from the
 * catalog description, so this is a hint; anything the parser can't read just has no edges.
 */
export interface UnlockCourse {
  id: CourseId;
  code: string;
  dept: string;
  prereqText: string | null;
}

export interface UnlocksResult {
  /** For each planned course, the later planned courses that list it as a prerequisite. */
  unlocks: Map<CourseId, CourseId[]>;
  /** Longest prerequisite chain, earliest first (empty when no course needs another). */
  criticalPath: CourseId[];
}

function codesIn(node: PrereqNode, out = new Set<string>()): Set<string> {
  if (node.kind === "course") out.add(node.code.toUpperCase());
  else if (node.kind === "and" || node.kind === "or") node.children.forEach((c) => codesIn(c, out));
  return out;
}

export function prerequisiteGraph(plan: Plan, details: Record<CourseId, UnlockCourse | undefined>): UnlocksResult {
  // Earliest planned term per course (a retake counts once).
  const term = new Map<CourseId, TermCode>();
  for (const s of [...plan.semesters].sort((a, b) => compareTerms(a.index, b.index)))
    for (const c of s.courses) if (!term.has(c.id)) term.set(c.id, s.index);

  const ids = [...term.keys()].filter((id) => details[id]);
  const needs = new Map<CourseId, Set<string>>();
  for (const id of ids) {
    const d = details[id]!;
    const node = d.prereqText ? parsePrereqs(d.prereqText, d.dept) : null;
    needs.set(id, node ? codesIn(node) : new Set());
  }

  const unlocks = new Map<CourseId, CourseId[]>(ids.map((id) => [id, []]));
  const before = new Map<CourseId, CourseId[]>(ids.map((id) => [id, []]));
  for (const a of ids) {
    const codes = equivalentCodes(details[a]!.code.toUpperCase());
    for (const b of ids) {
      if (a === b || compareTerms(term.get(a)!, term.get(b)!) >= 0) continue;
      if (codes.some((c) => needs.get(b)!.has(c))) {
        unlocks.get(a)!.push(b);
        before.get(b)!.push(a);
      }
    }
  }

  // Longest chain ending at each course, in term order (edges only go forward in time).
  const order = [...ids].sort((x, y) => compareTerms(term.get(x)!, term.get(y)!) || x - y);
  const depth = new Map<CourseId, number>();
  const prev = new Map<CourseId, CourseId | null>();
  for (const id of order) {
    let best: CourseId | null = null;
    for (const p of before.get(id)!) if (best === null || depth.get(p)! > depth.get(best)!) best = p;
    depth.set(id, best === null ? 1 : depth.get(best)! + 1);
    prev.set(id, best);
  }
  let end: CourseId | null = null;
  for (const id of order) if (end === null || depth.get(id)! > depth.get(end)!) end = id;
  const criticalPath: CourseId[] = [];
  if (end !== null && depth.get(end)! >= 2) for (let c: CourseId | null = end; c !== null; c = prev.get(c)!) criticalPath.unshift(c);

  return { unlocks, criticalPath };
}
