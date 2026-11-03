import { equivalentCodes, type CourseId } from "./course";
import type { Plan } from "./plan";
import { parsePrereqs, type PrereqNode } from "./prereqs";
import { compareTerms, type TermCode } from "./terms";

/**
 * Prerequisite "unlocks" graph and critical path (Phase B: B22). Written by Ishaan's Claude; "or"
 * handling by Hadi's Claude (follow-up to Michael's Codex's review of #74).
 *
 * Edge A → B when B is planned in a later term than A and B's catalog prerequisite text names A
 * (honors versions count as the base course). An edge is **required** only when, as planned, B has no
 * other way through its and/or tree: on A's route, no "or" has another branch already met by courses
 * planned before B. "CSCI 1133 or CSCI 1913" with both planned makes neither one required. The critical
 * path is the longest chain of required edges, so moving a course on it later pushes the next one back
 * unless the student adds an alternative. Prerequisite text is parsed from the catalog description, so
 * this is an inference; anything the parser can't read just has no edges.
 */
export interface UnlockCourse {
  id: CourseId;
  code: string;
  dept: string;
  prereqText: string | null;
}

export interface Unlock {
  id: CourseId;
  /** False when another course planned before it also meets that part of the prerequisite ("or"). */
  required: boolean;
}

export interface UnlocksResult {
  /** For each planned course, the later planned courses whose prerequisite text names it. */
  unlocks: Map<CourseId, Unlock[]>;
  /** Longest chain of required prerequisites, earliest first (empty when no course needs another). */
  criticalPath: CourseId[];
}

function codesIn(node: PrereqNode, out = new Set<string>()): Set<string> {
  if (node.kind === "course") out.add(node.code.toUpperCase());
  else if (node.kind === "and" || node.kind === "or") node.children.forEach((c) => codesIn(c, out));
  return out;
}

/** Same three-valued reading as `checkPrereqs`: null = only non-course text, which never blocks. */
function evaluate(n: PrereqNode, taken: (code: string) => boolean): boolean | null {
  if (n.kind === "course") return taken(n.code.toUpperCase());
  if (n.kind === "other") return null;
  const vals = n.children.map((c) => evaluate(c, taken));
  if (n.kind === "and") return vals.every((v) => v !== false);
  if (vals.some((v) => v === true)) return true;
  return vals.every((v) => v === null) ? null : false;
}

/**
 * Is course A (`isA`) needed on every way through `n`, given the other courses planned before
 * (`others`)? An "and" needs A if any part does. An "or" needs A only if a branch does and no other
 * branch is already met without A. Non-course text ("or consent") doesn't count as met, as in
 * `checkPrereqs`.
 */
function needsCourse(n: PrereqNode, isA: (code: string) => boolean, others: (code: string) => boolean): boolean {
  if (n.kind === "course") return isA(n.code.toUpperCase()) && !others(n.code.toUpperCase());
  if (n.kind === "other") return false;
  const needs = n.children.map((c) => needsCourse(c, isA, others));
  if (n.kind === "and") return needs.some(Boolean);
  return needs.some(Boolean) && n.children.every((c, i) => needs[i] || evaluate(c, others) !== true);
}

export function prerequisiteGraph(plan: Plan, details: Record<CourseId, UnlockCourse | undefined>): UnlocksResult {
  // Earliest planned term per course (a retake counts once).
  const term = new Map<CourseId, TermCode>();
  for (const s of [...plan.semesters].sort((a, b) => compareTerms(a.index, b.index)))
    for (const c of s.courses) if (!term.has(c.id)) term.set(c.id, s.index);

  const ids = [...term.keys()].filter((id) => details[id]);
  const tree = new Map<CourseId, PrereqNode | null>();
  const codesOf = new Map<CourseId, string[]>();
  for (const id of ids) {
    const d = details[id]!;
    tree.set(id, d.prereqText ? parsePrereqs(d.prereqText, d.dept) : null);
    codesOf.set(id, equivalentCodes(d.code.toUpperCase()));
  }

  const unlocks = new Map<CourseId, Unlock[]>(ids.map((id) => [id, []]));
  // Required edges only: the critical path follows these.
  const before = new Map<CourseId, CourseId[]>(ids.map((id) => [id, []]));
  for (const b of ids) {
    const node = tree.get(b);
    if (!node) continue;
    const named = codesIn(node);
    const earlier = ids.filter((x) => x !== b && compareTerms(term.get(x)!, term.get(b)!) < 0);
    for (const a of earlier) {
      const codes = codesOf.get(a)!;
      if (!codes.some((c) => named.has(c))) continue;
      const others = (code: string) => earlier.some((x) => x !== a && codesOf.get(x)!.includes(code));
      const required = needsCourse(node, (code) => codes.includes(code), others);
      unlocks.get(a)!.push({ id: b, required });
      if (required) before.get(b)!.push(a);
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
