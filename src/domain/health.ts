import type { CourseDetails, CourseId } from "./course";
import { courseCode } from "./course";
import { placeholderCredits, type Plan } from "./plan";
import type { PrereqCheck } from "./prereqs";
import { compareTerms, seasonOf, termLabel, toTermCode, type Season, type TermCode } from "./terms";

/**
 * Plan health (Phase B: B4 offering terms, B5 pacing, B6 health check). Pure functions over the plan
 * and cached course details; the editor turns the result into card badges and a header panel.
 */

export const GRADUATION_CREDITS = 120;
/** Loads above this usually need an adviser's or college's approval at UMN. Shown as a heads-up. */
export const HEAVY_LOAD = 18;
/** Below this a fall/spring semester is part-time. */
export const FULL_TIME = 12;

// ---------------------------------------------------------------------------
// B4: offering terms

/** Recorded terms needed before a course's seasons count as its offering pattern. */
export const KNOWN_OFFERING_TERMS = 3;

/**
 * - `known`: 3+ recorded terms. The seasons seen are treated as the course's pattern (B4).
 * - `limited` (L12, Hadi's Claude): 1–2 recorded terms, mostly new courses. The seasons seen are shown
 *   and searchable, labelled "limited history (N terms)", but they never produce a "hasn't run in this
 *   season" warning and never rule a season out (‹ › snap, registration), since one or two terms say
 *   little about the seasons a course skips. Autofill only *prefers* them (see `placeCourses`).
 * - neither: no recorded terms.
 */
export type Offering =
  | { known: false; limited: false }
  | { known: false; limited: true; seasons: Season[]; lastTerm: TermCode; termCount: number }
  | { known: true; limited: false; seasons: Season[]; lastTerm: TermCode; termCount: number };

/** Seasons a course has historically run in, from its recorded grade terms. Needs 3+ terms to judge. */
export function offeringHistory(termsOffered: string[]): Offering {
  const terms = [...new Set(termsOffered.filter((t) => /^1\d{2}[359]$/.test(t)))];
  if (terms.length === 0) return { known: false, limited: false };
  const order: Season[] = ["fall", "spring", "summer"];
  const seen = new Set(terms.map(seasonOf));
  const seasons = order.filter((s) => seen.has(s));
  const lastTerm = [...terms].sort(compareTerms).at(-1)!;
  const termCount = terms.length;
  return termCount < KNOWN_OFFERING_TERMS
    ? { known: false, limited: true, seasons, lastTerm, termCount }
    : { known: true, limited: false, seasons, lastTerm, termCount };
}

/** Seasons with recorded grades, for a known or a limited history; empty with no history. */
export function seenSeasons(o: Offering): Season[] {
  return o.known || o.limited ? o.seasons : [];
}

/** "limited history (2 terms)" for a short history, else null. */
export function limitedHistoryLabel(o: Offering): string | null {
  return o.limited ? `limited history (${o.termCount} term${o.termCount === 1 ? "" : "s"})` : null;
}

const SEASON_NAME: Record<Season, string> = { fall: "Fall", spring: "Spring", summer: "Summer" };

export function offeringNote(o: Offering): string {
  if (o.limited)
    return `Seen in ${o.seasons.map((s) => SEASON_NAME[s]).join(", ")}: a guess from a ${limitedHistoryLabel(o)}, through ${termLabel(o.lastTerm)}. It may run in other seasons too, so check Class Search.`;
  if (!o.known) return "Not enough history to tell when this course is offered.";
  return `Historically offered: ${o.seasons.map((s) => SEASON_NAME[s]).join(", ")} (through ${termLabel(o.lastTerm)}).`;
}

/**
 * True unless the course has never run in the planned season and its history is long enough to say so.
 * A limited history never counts against a season.
 */
export function offeredInSeason(o: Offering, term: TermCode): boolean {
  return !o.known || o.seasons.includes(seasonOf(term));
}

// ---------------------------------------------------------------------------
// B5: pacing

export interface SemesterLoad {
  term: TermCode;
  credits: number;
  courses: number;
}

export interface Pacing {
  credits: number;
  remaining: number;
  /** Last semester that has courses (the projected graduation term), or null for an empty plan. */
  finalTerm: TermCode | null;
  /** True when the planned credits reach the 120-credit minimum. */
  enough: boolean;
  loads: SemesterLoad[];
}

export function pacing(plan: Plan, credits: (id: CourseId) => number): Pacing {
  const seen = new Set<CourseId>();
  let total = 0;
  const loads = [...plan.semesters]
    .sort((a, b) => compareTerms(a.index, b.index))
    .map((s) => {
      let semCredits = 0;
      for (const c of s.courses) {
        semCredits += credits(c.id);
        if (!seen.has(c.id)) total += credits(c.id);
        seen.add(c.id);
      }
      // B2 (Ishaan's Claude): placeholder slots are planned credits too.
      const slots = placeholderCredits(s);
      semCredits += slots;
      total += slots;
      return { term: s.index, credits: semCredits, courses: s.courses.length + (s.placeholders?.length ?? 0) };
    });
  const finalTerm = [...loads].reverse().find((l) => l.courses > 0)?.term ?? null;
  return { credits: total, remaining: Math.max(GRADUATION_CREDITS - total, 0), finalTerm, enough: total >= GRADUATION_CREDITS, loads };
}

// ---------------------------------------------------------------------------
// B6: health check

export type IssueKind = "prereq" | "offering" | "heavy" | "light" | "credits" | "leave";

export interface HealthIssue {
  kind: IssueKind;
  /** "warning" needs attention; "info" is a heads-up. */
  severity: "warning" | "info";
  term: TermCode | null;
  courseId: CourseId | null;
  message: string;
}

/**
 * The UMN term in progress (or between terms, the one just finished) on `now`: Jan–May Spring,
 * Jun–Aug Summer, Sep–Dec Fall. Review fix by Ishaan's Claude (#33): compare whole terms, not years.
 */
export function currentTerm(now: Date): TermCode {
  const month = now.getMonth();
  const season: Season = month <= 4 ? "spring" : month <= 7 ? "summer" : "fall";
  return toTermCode({ year: now.getFullYear(), season });
}

export interface HealthInput {
  plan: Plan;
  courses: Record<CourseId, CourseDetails>;
  /** From prereqStatus: key `${term}:${courseId}`. */
  prereqs: Map<string, PrereqCheck>;
  /** Terms already over (completed or in progress) don't get load warnings. */
  now?: Date;
}

export function healthCheck({ plan, courses, prereqs, now = new Date() }: HealthInput): HealthIssue[] {
  const issues: HealthIssue[] = [];
  const credit = (id: CourseId) => courses[id]?.credits.min ?? 0;
  const current = currentTerm(now);

  for (const s of plan.semesters) {
    // B18: prior credit (AP / IB / transfer) is already earned, so it gets no prerequisite or offering notes.
    if (s.kind === "prior") continue;
    for (const c of s.courses) {
      const course = courses[c.id];
      if (!course || c.lock === "locked") continue;
      const code = courseCode(course);
      const p = prereqs.get(`${s.index}:${c.id}`);
      if (p && !p.met)
        issues.push({
          kind: "prereq",
          severity: p.hasOtherPaths ? "info" : "warning",
          term: s.index,
          courseId: c.id,
          message: `${code}: prerequisites not planned earlier (${p.missing})${p.hasOtherPaths ? ", or other ways to qualify" : ""}.`,
        });
      const o = offeringHistory(course.termsOffered);
      if (!offeredInSeason(o, s.index))
        issues.push({
          kind: "offering",
          severity: "warning",
          term: s.index,
          courseId: c.id,
          message: `${code} hasn't run in ${SEASON_NAME[seasonOf(s.index)]} before. ${offeringNote(o)}`,
        });
    }
  }

  const pace = pacing(plan, credit);
  // B19 (Ishaan's Claude): abroad / co-op / leave terms follow their own credit rules, so no load notes.
  const kinds = new Map(plan.semesters.map((s) => [s.index, s.kind]));
  for (const load of pace.loads) {
    // Completed and in-progress terms can't be changed anymore, so only upcoming terms get load notes.
    if (load.courses === 0 || compareTerms(load.term, current) <= 0) continue;
    if (kinds.get(load.term) === "leave")
      issues.push({
        kind: "leave",
        severity: "info",
        term: load.term,
        courseId: null,
        message: `${termLabel(load.term)} is marked as a leave of absence but has courses planned.`,
      });
    if (kinds.get(load.term)) continue;
    if (load.credits > HEAVY_LOAD)
      issues.push({
        kind: "heavy",
        severity: "info",
        term: load.term,
        courseId: null,
        message: `${termLabel(load.term)}: ${load.credits} credits. Loads over ${HEAVY_LOAD} usually need approval.`,
      });
    else if (seasonOf(load.term) !== "summer" && load.credits < FULL_TIME)
      issues.push({
        kind: "light",
        severity: "info",
        term: load.term,
        courseId: null,
        message: `${termLabel(load.term)}: ${load.credits} credits is part-time (under ${FULL_TIME}).`,
      });
  }
  if (pace.finalTerm && !pace.enough)
    issues.push({
      kind: "credits",
      severity: "warning",
      term: null,
      courseId: null,
      message: `${pace.credits} of ${GRADUATION_CREDITS} credits planned. ${pace.remaining} more to reach the ${GRADUATION_CREDITS}-credit baseline.`,
    });
  return issues;
}
