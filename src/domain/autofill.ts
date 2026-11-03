import { courseLevel, equivalentCodes, type CourseId } from "./course";
import { currentTerm, offeringHistory } from "./health";
import type { Plan } from "./plan";
import { checkPrereqs, parsePrereqs, type PrereqNode } from "./prereqs";
import type { ProgramResult, RuleResult } from "./requirements";
import { academicYear, compareTerms, seasonOf, type Season, type TermCode } from "./terms";

/**
 * Autofill the remaining semesters (Phase B: B24). Written by Hadi's Claude.
 *
 * A *suggestion* the student reviews; nothing changes until they accept it. Two steps:
 * 1. `pickCourses`: for every unsatisfied requirement (units > 0), the listed courses still needed to
 *    meet its course and credit minimums. A course already picked for another requirement is preferred,
 *    so double-dips come first. "Any of" groups take their first workable branch; text-only rules can't
 *    be filled and are reported.
 * 2. `placeCourses`: prerequisite order first, then each course goes into the earliest future term that
 *    historically offers it (after the term in progress), has room under the credit cap, and comes after its planned prerequisites.
 *    Hidden seasons and non-regular semesters (leave, prior credit) are skipped. Prerequisites outside
 *    the plan don't block; they're noted. Upper-division (3xxx+) courses aren't suggested for the plan's
 *    first academic year, since many list "upper division standing" as text the parser can't check.
 */
export interface Pick {
  courseId: CourseId;
  /** Requirement names this course is picked for. */
  reasons: string[];
}

export interface PickResult {
  picks: Pick[];
  /** Requirements autofill can't fill (text-only rules, nothing left to choose). */
  skipped: string[];
}

interface Picker {
  planned: ReadonlySet<CourseId>;
  picks: Map<CourseId, string[]>;
  credits: (id: CourseId) => number | undefined;
}

/** Fills one rule; returns false when it can't be filled from the listed courses. */
function fillRule(r: RuleResult, reason: string, p: Picker): boolean {
  const rule = r.rule;
  if (r.satisfied || r.units === 0) return true;
  if (rule.kind === "text") return false;
  if (rule.kind === "numberOf") {
    // C1: fill children until `count` of them are complete. The total-courses minimum isn't chased.
    const need = rule.count ?? 1;
    let filled = (r.children ?? []).filter((c) => c.satisfied && c.units > 0).length;
    for (const c of r.children ?? []) {
      if (filled >= need) break;
      if (!c.satisfied && c.rule.kind !== "text" && fillRule(c, reason, p)) filled++;
    }
    return filled >= need;
  }
  if (rule.kind !== "courses")
    return rule.kind === "allOf"
      ? (r.children ?? []).map((c) => fillRule(c, reason, p)).every(Boolean)
      : (r.children ?? []).some((c) => c.rule.kind !== "text" && fillRule(c, reason, p));

  let count = r.coursesCount ?? 0;
  let credits = r.credits ?? 0;
  const open = rule.choices
    .map((choice, i) => ({ choice, matched: r.choiceMatches?.[i] != null }))
    .filter((c) => !c.matched)
    .map(({ choice }) => choice.options.map((o) => o.courseId).filter((id): id is CourseId => id != null && !p.planned.has(id)))
    .filter((ids) => ids.length > 0)
    // Choices with an already-picked option first (double-dips), then catalog order.
    .sort((a, b) => Number(b.some((id) => p.picks.has(id))) - Number(a.some((id) => p.picks.has(id))));
  for (const ids of open) {
    if (count >= rule.minCourses && credits >= rule.minCredits) break;
    const id = ids.find((x) => p.picks.has(x)) ?? ids[0];
    const reasons = p.picks.get(id) ?? [];
    if (!reasons.includes(reason)) reasons.push(reason);
    p.picks.set(id, reasons);
    count++;
    credits += p.credits(id) ?? 3;
  }
  return count >= rule.minCourses && credits >= rule.minCredits;
}

export function pickCourses(results: ProgramResult[], planned: ReadonlySet<CourseId>, credits: (id: CourseId) => number | undefined = () => undefined): PickResult {
  const p: Picker = { planned, picks: new Map(), credits };
  const skipped: string[] = [];
  for (const program of results)
    for (const req of program.requirements) {
      if (req.satisfied || req.units === 0) continue;
      const ok = req.rules.map((r) => fillRule(r, req.requirement.name, p)).every(Boolean);
      if (!ok) skipped.push(results.length > 1 ? `${program.program.name}: ${req.requirement.name}` : req.requirement.name);
    }
  return { picks: [...p.picks].map(([courseId, reasons]) => ({ courseId, reasons })), skipped };
}

export interface AutofillCourse {
  id: CourseId;
  code: string;
  dept: string;
  /** Minimum credits. */
  credits: number;
  termsOffered: string[];
  prereqText: string | null;
}

export interface Placement {
  courseId: CourseId;
  term: TermCode;
  reasons: string[];
  /** Prerequisites that aren't anywhere in the plan, e.g. "MATH 1271". */
  note?: string;
  /** The year-one rule moved it later than it could otherwise go. */
  heldUpperDivision?: boolean;
}

export interface PlaceResult {
  placements: Placement[];
  unplaced: { courseId: CourseId; reasons: string[]; why: string }[];
}

export interface PlaceInput {
  plan: Plan;
  picks: Pick[];
  course: (id: CourseId) => AutofillCourse | undefined;
  hiddenSeasons?: readonly Season[];
  maxCredits?: number;
  /** Summer terms are skipped unless asked for (few students take a full load in summer). */
  useSummer?: boolean;
  /** Heuristic (docs/agent/heuristics.md): keep 3xxx+ courses out of the plan's first year. Default on. */
  holdUpperDivision?: boolean;
  now?: Date;
}

/**
 * In an "or" with an option that's in the plan (or picked), drop the options that aren't: the student
 * is taking that one, so the course must wait for it instead of counting an outside alternative.
 */
function prune(n: PrereqNode, relevant: (code: string) => boolean): PrereqNode {
  if (n.kind === "course" || n.kind === "other") return n;
  const children = n.children.map((c) => prune(c, relevant));
  const has = (c: PrereqNode): boolean => (c.kind === "course" ? relevant(c.code) : c.kind !== "other" && c.children.some(has));
  if (n.kind === "or" && children.some(has)) return { kind: "or", children: children.filter(has) };
  return { kind: n.kind, children };
}

export function placeCourses({ plan, picks, course, hiddenSeasons = [], maxCredits = 15, useSummer = false, holdUpperDivision = true, now = new Date() }: PlaceInput): PlaceResult {
  const from = currentTerm(now);
  const semesters = [...plan.semesters].sort((a, b) => compareTerms(a.index, b.index));
  const load = new Map(semesters.map((s) => [s.index, s.courses.reduce((n, c) => n + (course(c.id)?.credits ?? 3), 0) + (s.placeholders ?? []).reduce((n, p) => n + p.credits, 0)]));
  const terms = semesters
    .filter((s) => compareTerms(s.index, from) > 0 && !hiddenSeasons.includes(seasonOf(s.index)) && (useSummer || seasonOf(s.index) !== "summer") && (s.kind === undefined || s.kind === "abroad" || s.kind === "coop"))
    .map((s) => s.index);

  // Where each code is (or will be) taken: planned courses now, placements as they're made.
  const codeTerm = new Map<string, TermCode>();
  for (const s of semesters) for (const c of s.courses) for (const code of equivalentCodes(course(c.id)?.code ?? "")) if (code && !codeTerm.has(code)) codeTerm.set(code, s.index);
  const pickedCodes = new Set(picks.flatMap((p) => equivalentCodes(course(p.courseId)?.code ?? "")));

  // Prerequisite depth among the picks, so a course is placed after the picks it needs.
  const prereqCodes = (c: AutofillCourse | undefined) => {
    const node = c?.prereqText ? parsePrereqs(c.prereqText, c.dept) : null;
    const codes: string[] = [];
    const walk = (n: typeof node) => n && (n.kind === "course" ? codes.push(n.code) : n.kind !== "other" && n.children.forEach(walk));
    walk(node);
    return codes;
  };
  const byCode = new Map(picks.map((p) => [course(p.courseId)?.code ?? "", p.courseId]));
  const depth = new Map<CourseId, number>();
  const depthOf = (id: CourseId, seen = new Set<CourseId>()): number => {
    if (depth.has(id)) return depth.get(id)!;
    if (seen.has(id)) return 0;
    seen.add(id);
    const d = Math.max(0, ...prereqCodes(course(id)).map((code) => byCode.get(code)).filter((x): x is CourseId => x != null).map((x) => depthOf(x, seen) + 1));
    depth.set(id, d);
    return d;
  };
  const ordered = [...picks].sort(
    (a, b) => depthOf(a.courseId) - depthOf(b.courseId) || (course(a.courseId)?.code ?? "").localeCompare(course(b.courseId)?.code ?? ""),
  );

  const placements: Placement[] = [];
  const unplaced: PlaceResult["unplaced"] = [];
  for (const pick of ordered) {
    const c = course(pick.courseId);
    if (!c) {
      unplaced.push({ ...pick, why: "Not in the course data" });
      continue;
    }
    const offering = offeringHistory(c.termsOffered);
    const parsed = c.prereqText ? parsePrereqs(c.prereqText, c.dept) : null;
    const node = parsed && prune(parsed, (code) => codeTerm.has(code) || pickedCodes.has(code));
    let blocked = "No room under the credit limit in the remaining terms";
    let placed = false;
    const upper = holdUpperDivision && courseLevel(c.code.split(" ")[1] ?? "") >= 3000;
    let held = false;
    for (const t of terms) {
      if (upper && semesters.length && academicYear(t) === academicYear(semesters[0].index)) {
        held = true;
        continue;
      }
      if (offering.known && !offering.seasons.includes(seasonOf(t))) {
        blocked = "Not historically offered in the remaining terms";
        continue;
      }
      // Prerequisites that are in the plan (or picked) must come earlier; ones outside it don't block.
      const earlier = (code: string) => {
        const at = codeTerm.get(code);
        return at !== undefined ? compareTerms(at, t) < 0 : !pickedCodes.has(code);
      };
      if (node && !checkPrereqs(node, earlier).met) {
        blocked = "Its prerequisites can't fit before the last term";
        continue;
      }
      if ((load.get(t) ?? 0) + c.credits > maxCredits) continue;
      load.set(t, (load.get(t) ?? 0) + c.credits);
      for (const code of equivalentCodes(c.code)) codeTerm.set(code, t);
      const strict = node ? checkPrereqs(node, (code) => (codeTerm.get(code) !== undefined ? compareTerms(codeTerm.get(code)!, t) < 0 : false)) : null;
      placements.push({
        ...pick,
        term: t,
        ...(strict && !strict.met && !strict.hasOtherPaths ? { note: `Needs ${strict.missing}` } : {}),
        ...(held ? { heldUpperDivision: true } : {}),
      });
      placed = true;
      break;
    }
    if (!placed) unplaced.push({ ...pick, why: blocked });
  }
  return { placements, unplaced };
}
