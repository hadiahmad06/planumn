import type { ApasAudit, ApasCourse } from "./apas";
import type { CourseId } from "./course";
import {
  createEmptyPlan,
  MAX_PLACEHOLDERS_PER_SEMESTER,
  type PlaceholderCourse,
  type Plan,
  type PlannedCourse,
  type Semester,
} from "./plan.ts";
import { addPriorCredit } from "./planOps.ts";
import { compareTerms, nextTerm, termRange, type TermCode } from "./terms.ts";

/**
 * Turn a parsed APAS audit into a new plan (B1, after the parser). Written by Hadi's Claude.
 * Every rule here is listed in docs/agent/heuristics.md §4 and shown on /plan/apas before the plan opens.
 */

/** Why a course row wasn't put in the plan. */
export type ApasSkipReason =
  | "withdrawn"
  | "no-credit"
  | "failed"
  | "no-term"
  /** Same course twice in one term. */
  | "duplicate"
  /** The term already has the maximum number of placeholder slots. */
  | "slot-limit";

/** An audit's program and the planu.mn (CourseDog) program it maps to, if any. */
export interface ApasPlanProgram {
  apasCode: string;
  title: string;
  programId: string | null;
}

export interface ApasPlanResult {
  plan: Plan;
  /** Course rows placed as catalog courses. */
  matched: number;
  /** Rows not in planu.mn's catalog, placed as placeholder slots with their APAS credits. */
  placeholders: { code: string; term: TermCode | "prior" }[];
  skipped: { code: string; termRaw: string; reason: ApasSkipReason }[];
  /** The first audit's program (the only one for a single report). */
  program: ApasPlanProgram;
  /** Every audit's program, in import order (B1 multi-audit). */
  programs: ApasPlanProgram[];
  /**
   * Course rows left out because a newer report already lists the same course in the same term
   * (B1 multi-audit). 0 for a single report.
   */
  shared: number;
}

/**
 * APAS program codes vs CourseDog program group ids (checked against all 40 CSE degree programs on the
 * APAS run page, 2026-10-27, with no wrong matches):
 * - majors: APAS `1 PPPP SS DDD` (plan, sub-plan, degree) ↔ CourseDog `PPPP DDD CC` (college)
 * - minors: APAS `2 PPPP 00000` ↔ CourseDog `PPPP MIN…`
 * Only a unique match counts. Lower-division, honors and other pseudo-programs map to nothing.
 */
export function apasProgramId(
  apasCode: string,
  programIds: readonly string[],
): string | null {
  const code = apasCode.trim();
  let matches: string[] = [];
  if (/^1\d{9}$/.test(code) && code.slice(7) !== "000") {
    const prefix = code.slice(1, 5) + code.slice(7, 10);
    matches = programIds.filter(
      (id) => id.length === 9 && id.startsWith(prefix),
    );
  } else if (/^2\d{4}0{5}$/.test(code)) {
    matches = programIds.filter((id) =>
      id.startsWith(`${code.slice(1, 5)}MIN`),
    );
  }
  return matches.length === 1 ? matches[0] : null;
}

/** Placed at all: earned credit, or registered (in progress / planned). */
function placeable(c: ApasCourse): ApasSkipReason | null {
  if (c.kind === "withdrawn") return "withdrawn";
  if (c.kind === "no-credit") return "no-credit";
  if (c.kind === "completed" && !c.earnedCredit) return "failed";
  if (!c.term && c.kind !== "exam" && c.kind !== "transfer") return "no-term";
  return null;
}

/** UMN terms: courses taken or registered at the U (not exam or transfer credit). */
const atUmn = (c: ApasCourse) =>
  c.kind === "completed" ||
  c.kind === "in-progress" ||
  c.kind === "planned" ||
  c.kind === "withdrawn";

/** "10/27/2026 02:02 PM" (APAS's "Prepared On") as a sortable number, or null when unreadable. */
export function apasPreparedTime(preparedOn: string | null): number | null {
  const m = preparedOn?.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*([AP]M))?/i);
  if (!m) return null;
  const hour = m[4] ? (Number(m[4]) % 12) + (m[6].toUpperCase() === "PM" ? 12 : 0) : 0;
  return Date.UTC(Number(m[3]), Number(m[1]) - 1, Number(m[2]), hour, Number(m[5] ?? 0));
}

/** Course + term: the same row on two reports. A retake in another term has another key. */
const rowKey = (c: ApasCourse) => `${c.term ?? `?${c.termRaw.trim().toUpperCase()}`}|${c.code.toUpperCase()}`;

/**
 * B1 multi-audit (Hadi's Claude): one course list from several reports for the same student (a major
 * and a minor, or two majors; APAS shows one program per report). Reports are read newest-prepared
 * first (import order when a date is missing or equal). A report's rows for a course and term that a
 * newer report already lists are dropped, so a course two reports share is placed once and the newest
 * report's grade and status win. Within one report every row is kept, so retakes and the same-term
 * rules in `apasPlan` work as for a single report. Rule in docs/agent/heuristics.md §4.
 */
export function mergeApasCourses(audits: readonly ApasAudit[]): { courses: ApasCourse[]; shared: number } {
  const newestFirst = audits
    .map((audit, i) => ({ audit, i, t: apasPreparedTime(audit.preparedOn) ?? -Infinity }))
    .sort((a, b) => (b.t === a.t ? a.i - b.i : b.t - a.t));
  const seen = new Set<string>();
  const courses: ApasCourse[] = [];
  let shared = 0;
  for (const { audit } of newestFirst) {
    const mine = audit.courses.filter((c) => !seen.has(rowKey(c)));
    shared += audit.courses.length - mine.length;
    courses.push(...mine);
    for (const c of mine) seen.add(rowKey(c));
  }
  return { courses, shared };
}

/** A single report's plan. Same as `apasPlanFromAudits([audit], …)`. */
export function apasPlan(
  audit: ApasAudit,
  /** Catalog ids by "DEPT NUMBER" (server lookup). */
  ids: ReadonlyMap<string, CourseId>,
  programIds: readonly string[],
  now = new Date(),
): ApasPlanResult {
  return apasPlanFromAudits([audit], ids, programIds, now);
}

/**
 * One plan from one or more APAS audits (B1 multi-audit): the courses merged by `mergeApasCourses`,
 * every audit's mapped program (each once, in import order) and the latest expected graduation term.
 * Placeholders, prior credit and skipped rows follow the single-report rules unchanged.
 */
export function apasPlanFromAudits(
  audits: readonly ApasAudit[],
  /** Catalog ids by "DEPT NUMBER" (server lookup). */
  ids: ReadonlyMap<string, CourseId>,
  programIds: readonly string[],
  now = new Date(),
): ApasPlanResult {
  if (audits.length === 0) throw new Error("apasPlanFromAudits needs at least one audit");
  const { courses, shared } = mergeApasCourses(audits);
  const grads = audits
    .map((a) => a.expectedGradTerm)
    .filter((t): t is TermCode => t != null)
    .sort(compareTerms);
  const audit: ApasAudit = { ...audits[0], courses, expectedGradTerm: grads.at(-1) ?? null };
  const programs: ApasPlanProgram[] = audits.map((a) => ({
    apasCode: a.program.code,
    title: a.program.title,
    programId: apasProgramId(a.program.code, programIds),
  }));

  const umnTerms = audit.courses
    .filter((c) => atUmn(c) && c.term)
    .map((c) => c.term!)
    .sort(compareTerms);
  const first = umnTerms[0] ?? createEmptyPlan(now).semesters[0].index;
  const lastCourse = umnTerms[umnTerms.length - 1] ?? first;
  // Through the expected graduation term, else four years from the first UMN term.
  const fourYears = termRange(first, 4).at(-1)!;
  const end = [audit.expectedGradTerm ?? fourYears, lastCourse].sort(
    compareTerms,
  )[1];
  const semesters: Semester[] = [];
  for (
    let t = first;
    compareTerms(t, end) <= 0 && semesters.length < 60;
    t = nextTerm(t)
  )
    semesters.push({ index: t, courses: [] });

  let plan: Plan = {
    ...createEmptyPlan(now),
    title: `Imported from APAS`,
    programs: [...new Set(programs.flatMap((p) => (p.programId ? [p.programId] : [])))],
    semesters,
  };
  plan = addPriorCredit(plan, now);
  const prior = plan.semesters.find((s) => s.kind === "prior")!;

  const result: Pick<ApasPlanResult, "matched" | "placeholders" | "skipped"> = {
    matched: 0,
    placeholders: [],
    skipped: [],
  };
  for (const c of audit.courses) {
    const reason = placeable(c);
    if (reason) {
      result.skipped.push({ code: c.code, termRaw: c.termRaw, reason });
      continue;
    }
    // Exam credit always, and transfer credit from before the first UMN term, go to prior credit.
    const toPrior =
      c.kind === "exam" ||
      (c.kind === "transfer" && (!c.term || compareTerms(c.term, first) < 0));
    const semester = toPrior
      ? prior
      : plan.semesters.find((s) => s.index === c.term && s.kind !== "prior");
    if (!semester) {
      result.skipped.push({
        code: c.code,
        termRaw: c.termRaw,
        reason: "no-term",
      });
      continue;
    }
    const id = ids.get(c.code.toUpperCase());
    if (id != null) {
      if (semester.courses.some((x) => x.id === id)) {
        result.skipped.push({ code: c.code, termRaw: c.termRaw, reason: "duplicate" });
        continue;
      }
      const course: PlannedCourse = { id, lock: "locked" };
      semester.courses.push(course);
      result.matched++;
    } else {
      const slots = (semester.placeholders ??= []);
      const key = `apas-${c.code.replace(/\s+/g, "-").toLowerCase()}`;
      // Counted only once actually inserted (review fix from Michael's Codex on #71).
      const reason: ApasSkipReason | null = slots.some((p) => p.key === key)
        ? "duplicate"
        : slots.length >= MAX_PLACEHOLDERS_PER_SEMESTER
          ? "slot-limit"
          : null;
      if (reason) {
        result.skipped.push({ code: c.code, termRaw: c.termRaw, reason });
        continue;
      }
      const slot: PlaceholderCourse = {
        key,
        label: `${c.code}${c.title ? ` · ${c.title}` : ""}`.slice(0, 80),
        credits: Math.min(Math.max(c.credits, 0), 20),
      };
      slots.push(slot);
      result.placeholders.push({
        code: c.code,
        term: toPrior ? "prior" : semester.index,
      });
    }
  }
  return { plan, ...result, program: programs[0], programs, shared };
}
