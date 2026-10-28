import type { CourseId } from "./course";

/**
 * Phase C/C2 (Hadi's Claude): credit constraints that most programs state only in prose
 * ("Must total 23 credits; 11 must have a CSCI designator", "up to 12 credits of …", "a minimum of
 * 22 credits coming from the Core Department Electives").
 *
 * Hadi, 2026-10-28: **show first.** These are displayed, labelled "read from catalog text", and do
 * **not** count toward progress until C4 shows they agree with APAS. Structured CourseDog fields
 * (`minCredits`, `restriction`) keep counting as before. Every pattern here has a row in
 * docs/agent/heuristics.md.
 */

export type CreditConstraintKind =
  /** Credits this rule needs in all: "Take at least 12 credits", "Must total 23 credits". */
  | "total"
  /** Credits allowed from a named part: "up to 12 credits of …", "A maximum of 6 credits …". */
  | "max"
  /** Credits needed from a named part: "a minimum of 22 credits coming from the Core Department Electives". */
  | "min"
  /** Credits needed with one subject designator: "11 must have a CSCI designator". */
  | "dept";

export interface CreditConstraint {
  kind: CreditConstraintKind;
  credits: number;
  /** total only: the top of a range ("18 - 24 credits"). */
  maxCredits?: number;
  /** min/max: the part the catalog names, as written (absent on a max = the rule itself); dept: the subject code ("CSCI"). */
  scope?: string;
  /** "text" = matched a phrase pattern; "override" = hand-entered for a program the patterns misread. */
  source: "text" | "override";
  /** The sentence it came from (or the override's note), shown on hover. */
  sentence: string;
}

/**
 * Sentences about graduate study, sub-plan or whole-program totals, waivers, transfer, or a course's
 * own credit value aren't constraints on the rule they sit in.
 */
const SKIP =
  /sub-?plan|master|doctoral|ph\.?\s?d|graduate|\bm\.?s\.? students|waive|double[- ]count|transfer|integrated|taken for|senior year|toward (?:the|a|your) (?:b\.|bachelor|degree|major|minor)|to complete the|in order to count|or greater|for either|plan [ab]\b|degree program|from each|in each|each of|of the (?:two|three|four|five)\b/i;

/** Numbers above this aren't one rule's credits (program totals like "109 credits"). */
const MAX_RULE_CREDITS = 60;

const NUM = String.raw`(\d{1,2})`;
const CREDITS = String.raw`(?:total\s+)?(?:[a-z-]+\s+){0,3}?credits?\b`;

/** "the following", "this list", "the list below": the rule itself, not a named part. */
const SELF_SCOPE = /^(?:the\s+)?(?:following|this list|lists?(?: (?:below|above|provided))?|(?:courses|groups)(?: listed)? below|these(?: courses| lists)?)\b/i;

function cleanScope(raw: string | undefined): string | undefined {
  const s = raw
    ?.replace(/\s+(?:may|can|must|will|to|toward|towards|count|counts|and apply|that|which|in consultation)\b.*$/i, "")
    .replace(/\s*\(.*$/, "")
    .replace(/^total\b\s*(?:(?:from|of)\s+)?/i, "")
    .replace(/^(?:the|any)\s+/i, "")
    .trim();
  if (!s || SELF_SCOPE.test(s)) return undefined;
  return s;
}

const PATTERNS: { kind: CreditConstraintKind; re: RegExp }[] = [
  // "Of the 23 credits, 11 must have a CSCI designator" / "11 credits must carry the CSCI designator"
  { kind: "dept", re: new RegExp(String.raw`${NUM}(?:\s+credits?)?\s+must\s+(?:have|carry)\s+(?:an?|the)\s+([A-Z]{2,5})\s+designator`, "g") },
  // "up to 12 credits of additional approved technical electives", "A maximum of 2 credits may come from Directed Study"
  {
    kind: "max",
    re: new RegExp(String.raw`(?:up to|a maximum of|maximum of|at most|no more than)\s+${NUM}\s+${CREDITS}(?:\s+(?:can|may)\s+(?:come|be))?(?:\s+(?:of|from|in))?\s*([^.;,:]*)`, "gi"),
  },
  // "with a minimum of 22 credits coming from the Core Department Electives", "At least 20 credits must come from courses listed in …"
  {
    kind: "min",
    re: new RegExp(String.raw`(?:a minimum of|minimum of|at least)\s+${NUM}(?:\s+${CREDITS})?\s+(?:must\s+)?(?:coming|come|be|must come)\s+from\s+([^.;,:]*)`, "gi"),
  },
  // "Must total 23 credits", "Take at least 12 credits of Electives", "Take 6 or more courses totaling 18 - 24 credits", "A total of 23 credits"
  {
    kind: "total",
    re: new RegExp(
      String.raw`(?:(?:must total|totaling|a total of)\s+(?:a minimum of\s+|at least\s+)?|(?:complete|take|earn|select|choose)\s+(?:a total of\s+|at least\s+|a minimum of\s+)?)${NUM}(?:\s*(?:-|–|to)\s*${NUM})?(?:\s+or more)?\s+${CREDITS}(?:\s+(?:of|from)\s+([^.;,:]*))?`,
      "gi",
    ),
  },
];

/**
 * Reads the credit constraints in one rule's catalog text (its `description` and `notes`). `ruleName`
 * tells "24 credits of Art History Electives" (the rule's own total) from "6 credits of 5xxx-level
 * courses" (a part of it).
 */
export function readCreditConstraints(text: string | null | undefined, ruleName = ""): CreditConstraint[] {
  const out: CreditConstraint[] = [];
  for (const sentence of (text ?? "").split(/(?<=[.;])\s+|\n+/)) {
    if (SKIP.test(sentence)) continue;
    const taken: [number, number][] = [];
    const found: CreditConstraint[] = [];
    for (const { kind, re } of PATTERNS) {
      for (const m of sentence.matchAll(re)) {
        const start = m.index ?? 0;
        const end = start + m[0].length;
        if (taken.some(([a, b]) => start < b && end > a)) continue; // one reading per phrase
        if (kind === "total" && /additional/i.test(m[0])) continue; // "an additional 6 credits": relative to something else
        const credits = Number(m[1]);
        if (!(credits > 0 && credits <= MAX_RULE_CREDITS)) continue;
        taken.push([start, end]);
        const c: CreditConstraint = { kind, credits, source: "text", sentence: sentence.trim() };
        if (kind === "dept") c.scope = m[2];
        if (kind === "max" || kind === "min") {
          const scope = cleanScope(m[2]);
          // "Take at least 12 credits from the following" names no part: it's the rule's total.
          // A cap that names no part caps the rule itself only when it says so ("up to 4 credits total
          // from this list"); in a bullet ("• Non-EE 4000 and 5000 level coursework--maximum of 12 credits")
          // the part is the bullet's subject.
          const bullet = sentence.match(/^\s*•?\s*(.+?)\s*(?:--|—|:)/)?.[1];
          if (scope) c.scope = scope;
          else if (kind === "min") c.kind = "total";
          else if (bullet && !/this list|these courses|following/i.test(sentence)) c.scope = bullet;
          else if (!/this list|these courses|following|total/i.test(sentence)) continue;
        }
        if (kind === "total" && m[2]) c.maxCredits = Number(m[2]);
        if (kind === "total") {
          const part = cleanScope(m[3]?.split(/:/)[0]);
          if (part && !/^(?:electives?|courses?|coursework)$/i.test(part) && !findPart(part, [{ name: ruleName, courseIds: new Set() }])) {
            c.kind = "min";
            c.scope = part;
          }
        }
        // "A total of 6 credits from this list may count towards major electives" is a cap.
        if (c.kind === "total" && /\b(?:may|can) count\b/i.test(sentence)) c.kind = "max";
        found.push(c);
      }
    }
    // "Of these 24 credits, … a minimum of 12" and "6 or more credits … and 12 or more credits in …"
    // describe parts the text doesn't name in a way we can match: keep only the unambiguous readings.
    const subset = /^\s*of (?:these|the) \d+ credits/i.test(sentence);
    // A credit amount nothing explains ("… and 12 or more credits in an area") means a total may be partial.
    const mentions = sentence.match(/\b\d{1,2}(?:\s+or more)?\s+credits?\b/gi)?.length ?? 0;
    const totals = found.filter((c) => c.kind === "total").length + (mentions > found.length ? 1 : 0);
    for (const c of found) {
      if ((subset && c.kind !== "dept") || (c.kind === "total" && totals > 1)) continue;
      if (!out.some((o) => o.kind === c.kind && o.credits === c.credits && o.scope === c.scope)) out.push(c);
    }
  }
  return out;
}

/** A course a rule lists, with what C2 needs to evaluate constraints. */
export interface ListedCourse {
  courseId: CourseId;
  /** "CSCI 4041"; the subject is the part before the space. */
  code: string | null;
}

/** A named part of the rule (a child rule) whose courses a min/max constraint can be checked against. */
export interface ConstraintPart {
  name: string;
  courseIds: Set<CourseId>;
}

export interface ConstraintProgress {
  constraint: CreditConstraint;
  /** Planned credits that count toward it; null = planu.mn can't tell which courses the text means. */
  planned: number | null;
  /** total/min/dept: planned ≥ credits (a bounded total also ≤ maxCredits); max: planned ≤ credits. null when it can't be checked. */
  met: boolean | null;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** A part whose name matches the catalog's wording ("Core Department Electives" ≈ "Core Dept. Electives" doesn't). */
export function findPart(scope: string, parts: ConstraintPart[]): ConstraintPart | undefined {
  const s = norm(scope);
  if (!s) return undefined;
  return parts.find((p) => norm(p.name) === s) ?? parts.find((p) => norm(p.name).length > 3 && (s.includes(norm(p.name)) || norm(p.name).includes(s)));
}

/**
 * Planned credits against each constraint. `listed` = every course the rule lists; `planned` = the
 * plan's courses with the credits the audit counts. Only courses the rule lists ever count.
 */
export function constraintProgress(
  constraints: CreditConstraint[],
  listed: ListedCourse[],
  parts: ConstraintPart[],
  planned: { courseId: CourseId; credits: number }[],
): ConstraintProgress[] {
  const byId = new Map(listed.map((c) => [c.courseId, c]));
  const counted = [...new Map(planned.filter((p) => byId.has(p.courseId)).map((p) => [p.courseId, p])).values()];
  const sum = (keep: (id: CourseId) => boolean) => counted.filter((p) => keep(p.courseId)).reduce((n, p) => n + p.credits, 0);
  return constraints.map((constraint) => {
    let planned: number | null = null;
    if (constraint.kind === "total") planned = sum(() => true);
    if (constraint.kind === "dept") {
      const subject = constraint.scope?.toUpperCase();
      planned = sum((id) => byId.get(id)?.code?.split(" ")[0]?.toUpperCase() === subject);
    }
    if (constraint.kind === "max" && !constraint.scope) planned = sum(() => true);
    else if (constraint.kind === "min" || constraint.kind === "max") {
      const part = constraint.scope ? findPart(constraint.scope, parts) : undefined;
      if (part) planned = sum((id) => part.courseIds.has(id));
    }
    const met =
      planned == null
        ? null
        : constraint.kind === "max"
          ? planned <= constraint.credits
          : planned >= constraint.credits && (constraint.kind !== "total" || !constraint.maxCredits || planned <= constraint.maxCredits);
    return { constraint, planned, met };
  });
}

/** "At least 23 credits", "At most 12 credits from Directed Study", "11 credits with a CSCI designator". */
export function describeConstraint(c: CreditConstraint): string {
  const cr = (n: number) => `${n} credit${n === 1 ? "" : "s"}`;
  switch (c.kind) {
    case "total":
      return c.maxCredits && c.maxCredits > c.credits ? `${c.credits}–${cr(c.maxCredits)} in all` : `At least ${cr(c.credits)} in all`;
    case "min":
      return `At least ${cr(c.credits)} from ${c.scope}`;
    case "max":
      return c.scope ? `At most ${cr(c.credits)} from ${c.scope}` : `At most ${cr(c.credits)} from this list`;
    case "dept":
      return `At least ${cr(c.credits)} with a ${c.scope} designator`;
  }
}
