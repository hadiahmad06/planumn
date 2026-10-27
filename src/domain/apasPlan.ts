import type { ApasAudit, ApasCourse } from "./apas";
import type { CourseId } from "./course";
import {
  createEmptyPlan,
  MAX_PLACEHOLDERS_PER_SEMESTER,
  type PlaceholderCourse,
  type Plan,
  type PlannedCourse,
  type Semester,
} from "./plan";
import { addPriorCredit } from "./planOps";
import { compareTerms, nextTerm, termRange, type TermCode } from "./terms";

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

export interface ApasPlanResult {
  plan: Plan;
  /** Course rows placed as catalog courses. */
  matched: number;
  /** Rows not in planu.mn's catalog, placed as placeholder slots with their APAS credits. */
  placeholders: { code: string; term: TermCode | "prior" }[];
  skipped: { code: string; termRaw: string; reason: ApasSkipReason }[];
  /** The audit's program and the planu.mn (CourseDog) program it maps to, if any. */
  program: { apasCode: string; title: string; programId: string | null };
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

export function apasPlan(
  audit: ApasAudit,
  /** Catalog ids by "DEPT NUMBER" (server lookup). */
  ids: ReadonlyMap<string, CourseId>,
  programIds: readonly string[],
  now = new Date(),
): ApasPlanResult {
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

  const programId = apasProgramId(audit.program.code, programIds);
  let plan: Plan = {
    ...createEmptyPlan(now),
    title: `Imported from APAS`,
    programs: programId ? [programId] : [],
    semesters,
  };
  plan = addPriorCredit(plan, now);
  const prior = plan.semesters.find((s) => s.kind === "prior")!;

  const result: Omit<ApasPlanResult, "plan" | "program"> = {
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
  return {
    plan,
    ...result,
    program: {
      apasCode: audit.program.code,
      title: audit.program.title,
      programId,
    },
  };
}
