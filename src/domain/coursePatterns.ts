import { equivalentCodes, type CourseId } from "./course.ts";

/**
 * Phase C/C3 (Hadi's Claude): course patterns read from catalog text.
 *
 * Some leaf rules list no courses; what they mean is a subject-and-level pattern in their name, notes or
 * description: "Complete additional 4xxx/5xxx EE courses … Excludes EE 4981H … Includes CSCI 4203",
 * "SPAN 5xxx", "Any 4xxx or higher ESCI course", "Upper-Division Electives: non-ARCH".
 *
 * Hadi, 2026-10-28: **show first.** Planned courses matching a pattern are listed and labelled "read from
 * catalog text", and **never** count toward progress until C4 shows the readings agree with APAS. Every
 * reading rule here has a row in docs/agent/heuristics.md.
 */

/** Which phrase shapes a reading used (for the coverage report and tests). */
export type PatternForm =
  /** "EE 4xxx", "APEC 3xxx-5xxx", "GER / SCAN 5xxx-level" */
  | "subject-level"
  /** "4xxx/5xxx EE/CSCI", "4xxx/5xxx EE courses" */
  | "level-subject"
  /** "4xxx or higher ESCI", "FSCN 3xxx or above" */
  | "or-higher"
  /** "xxxx 3xxx": any subject */
  | "any-subject"
  /** "non-ARCH" */
  | "non-subject"
  /** "Excluding: EE 4981H", "except …" */
  | "exclude"
  /** "Includes CSCI 4203" */
  | "include";

/** One alternative of a pattern: a course matches when its subject and level both fit. */
export interface PatternTerm {
  /** Subject codes allowed ("EE", "CSCI"); empty = any subject (only with "xxxx" or a `notSubjects` list). */
  subjects: string[];
  /** Subjects excluded ("non-ARCH"). */
  notSubjects: string[];
  /** Leading digits of allowed course numbers (4 = 4xxx), ascending; empty = any level. */
  levels: number[];
  /** "or higher": every level from the lowest one up. */
  orHigher?: boolean;
}

export interface CoursePattern {
  /** A course matching any term counts. */
  terms: PatternTerm[];
  /** Course codes the text excludes ("EE 4981H"). An excluded base code also excludes its H/V/W versions. */
  exclude: string[];
  /** Course codes the text adds outside the terms ("CSCI 4203"). */
  include: string[];
  forms: PatternForm[];
  /** The sentences it was read from, shown on hover. */
  sentences: string[];
}

/**
 * Caps on part of the work ("Students may not exceed a combined 16 credits … of EE 5000 level graduate
 * coursework", "Non-EE 4000 and 5000 level coursework--maximum of 12 credits") limit a pattern rather than
 * define one, so their sentences are skipped. C2 reads such caps as credit constraints instead.
 */
const CAP = /\b(?:not\s+exceed|exceed(?:s|ing)?\s+\d|maximum\s+of|max\.?\s+of|no\s+more\s+than|up\s+to\s+\d|at\s+most|cannot\s+exceed|limited\s+to)\b/i;

/** Uppercase words that aren't subject codes, for when no list of catalog subjects is given. */
const NOT_SUBJECTS = new Set(["XXXX", "OR", "AND", "THE", "OF", "IN", "TO", "FOR", "ALL", "ANY", "NOT", "ONLY", "BA", "BS", "MA", "MS", "PHD", "GPA", "UMN", "CLE", "WI", "AP", "IB", "US", "USA", "NOTE"]);

const LEVEL = /\b([1-9])[xX]{3}\b/g;
/** Text allowed between two level tokens of one list; a dash, "to" or "through" makes a range. */
const LEVEL_GAP = /^(?:[- ]?level)?\s*(\/|,|-|–|or|and\/or|and|to|through)\s*$/i;
const SUBJECT_LIST = String.raw`[A-Z]{2,4}(?:\s*(?:\/|,|and\/or|or|and)\s*[A-Z]{2,4})*`;
/** Before a level list: "xxxx " (any subject; tried first), "non-ARCH ", "EE/CSCI ". */
const PREFIX = new RegExp(String.raw`(?:\b([xX]{4})|\b([Nn]on-?\s?)?(${SUBJECT_LIST}))\s*$`);
const OR_HIGHER = /^(?:[- ]?level)?(?:\s+(?:courses?|coursework|classes))?\s*(?:\+|or\s+(?:higher|above|greater)|and\s+(?:higher|above|up))/i;
const SUFFIX = new RegExp(String.raw`^(?:[- ]?level)?(?:\s*(?:\+|or\s+(?:higher|above|greater)|and\s+(?:higher|above|up)))?(?:[- ]?level)?\s+(${SUBJECT_LIST})\b`);
const NON_SUBJECT = /\b[Nn]on-?\s?([A-Z]{2,4})\b/g;
const KEYWORD =
  /\b(?:(not\s+includ(?:e|es|ing)|does\s+not\s+include|exclud(?:e|es|ing)|except(?:\s+for)?|other\s+than)|(includ(?:e|es|ing)|also\s+(?:allowed|accepted|counts?)))\b/gi;
const CODE = /\b([A-Z]{2,4})\s?(\d{4}[A-Z]?)\b|\b(\d{4}[A-Z]?)\b/g;

type Mode = "exclude" | "include" | null;

interface Options {
  /** Catalog subject codes; a capitalized word outside it isn't read as a subject. */
  subjects?: ReadonlySet<string>;
}

function subjectList(raw: string, isSubject: (s: string) => boolean): string[] {
  return [...raw.matchAll(/[A-Z]{2,4}/g)].map((m) => m[0]).filter(isSubject);
}

/** Course codes in a clause; a bare number takes the last subject ("CSCI 4203, 4211"). */
function codesIn(text: string, isSubject: (s: string) => boolean): string[] {
  const out: string[] = [];
  let last: string | null = null;
  for (const m of text.matchAll(CODE)) {
    if (m[1] && isSubject(m[1])) {
      last = m[1];
      out.push(`${m[1]} ${m[2]}`);
    } else if (m[3] && last) out.push(`${last} ${m[3]}`);
  }
  return out;
}

/** Splits a sentence into clauses: before any keyword (`carry`), then one per exclude/include keyword. */
function clauses(sentence: string, carry: Mode): { mode: Mode; text: string }[] {
  const out: { mode: Mode; text: string }[] = [];
  let start = 0;
  let mode = carry;
  for (const m of sentence.matchAll(KEYWORD)) {
    out.push({ mode, text: sentence.slice(start, m.index) });
    mode = m[1] ? "exclude" : "include";
    start = (m.index ?? 0) + m[0].length;
  }
  out.push({ mode, text: sentence.slice(start) });
  return out;
}

/** Level-token lists in a clause: "4xxx/5xxx", "3xxx-5xxx", "1xxx or 2xxx". */
function levelRuns(text: string): { start: number; end: number; levels: number[] }[] {
  const tokens = [...text.matchAll(LEVEL)].map((m) => ({ start: m.index ?? 0, end: (m.index ?? 0) + m[0].length, digit: Number(m[1]) }));
  const runs: { start: number; end: number; levels: number[] }[] = [];
  for (const t of tokens) {
    const prev = runs.at(-1);
    const gap = prev ? text.slice(prev.end, t.start).match(LEVEL_GAP) : null;
    if (prev && gap) {
      const from = prev.levels.at(-1)!;
      const range = /^(?:-|–|to|through)$/i.test(gap[1]) && t.digit > from;
      for (let d = range ? from + 1 : t.digit; d <= t.digit; d++) if (!prev.levels.includes(d)) prev.levels.push(d);
      prev.end = t.end;
    } else runs.push({ start: t.start, end: t.end, levels: [t.digit] });
  }
  return runs;
}

const termKey = (t: PatternTerm) => JSON.stringify([t.subjects, t.notSubjects, t.levels, !!t.orHigher]);

/**
 * Reads a course pattern from a leaf rule's catalog text (its name, description, notes and freeform text,
 * joined by newlines). Returns null when nothing pattern-like is found. Patterns without a subject are
 * read only from "xxxx Nxxx" (any subject) and "non-SUBJ"; a bare "1xxx or 2xxx" is ignored.
 */
export function readCoursePattern(text: string | null | undefined, options: Options = {}): CoursePattern | null {
  const isSubject = (s: string) => (options.subjects ? options.subjects.has(s) : !NOT_SUBJECTS.has(s));
  const terms: PatternTerm[] = [];
  const exclude = new Set<string>();
  const include = new Set<string>();
  const forms = new Set<PatternForm>();
  const sentences = new Set<string>();
  const all = text ?? "";
  // "Upper-division electives: non-ARCH" gives a level to a pattern that names no level.
  const upper = /\bupper[- ]?division\b/i.test(all);
  const lower = /\blower[- ]?division\b/i.test(all);
  const divisionLevels = upper === lower ? null : upper ? { levels: [3], orHigher: true } : { levels: [1, 2] };

  let carry: Mode = null;
  for (const raw of all.split(/(?<=[.;])\s+|\n+/)) {
    const sentence = raw.trim();
    if (!sentence) continue;
    if (CAP.test(sentence)) {
      carry = null;
      continue;
    }
    // A bulleted list after "Excluding:" continues it: "• EE 4951W".
    const continues: Mode = carry && /^(?:•\s*)?[A-Z]{2,4}\s?\d{4}/.test(sentence) ? carry : null;
    let used = false;
    let mode: Mode = null;
    for (const clause of clauses(sentence, continues)) {
      mode = clause.mode;
      if (clause.mode) {
        const codes = codesIn(clause.text, isSubject);
        for (const c of codes) (clause.mode === "exclude" ? exclude : include).add(c);
        if (codes.length) {
          forms.add(clause.mode);
          used = true;
        }
        if (clause.mode === "exclude") continue; // "Excludes EE 5xxx" isn't something that counts
      }
      const consumed: [number, number][] = [];
      for (const run of levelRuns(clause.text)) {
        const head = clause.text.slice(0, run.start);
        const tail = clause.text.slice(run.end);
        const prefix = head.match(PREFIX);
        const suffix = tail.match(SUFFIX);
        const orHigher = OR_HIGHER.test(tail);
        const term: PatternTerm = { subjects: [], notSubjects: [], levels: [...run.levels].sort((a, b) => a - b), ...(orHigher ? { orHigher } : {}) };
        let any = false;
        if (prefix?.[1]) {
          any = true;
          forms.add("any-subject");
        } else if (prefix?.[3] && prefix[2]) {
          term.notSubjects = subjectList(prefix[3], isSubject);
          if (term.notSubjects.length) forms.add("non-subject");
          consumed.push([run.start - prefix[0].length, run.start]);
        } else if (prefix?.[3]) {
          term.subjects = subjectList(prefix[3], isSubject);
          if (term.subjects.length) forms.add("subject-level");
        }
        if (!term.subjects.length && !term.notSubjects.length && !any && suffix) {
          term.subjects = subjectList(suffix[1], isSubject);
          if (term.subjects.length) forms.add("level-subject");
        }
        if (!term.subjects.length && !term.notSubjects.length && !any) continue;
        if (orHigher) forms.add("or-higher");
        terms.push(term);
        used = true;
      }
      for (const m of clause.text.matchAll(NON_SUBJECT)) {
        const at = m.index ?? 0;
        if (consumed.some(([a, b]) => at >= a && at < b) || !isSubject(m[1])) continue;
        terms.push({ subjects: [], notSubjects: [m[1]], levels: divisionLevels?.levels ?? [], ...(divisionLevels?.orHigher ? { orHigher: true } : {}) });
        forms.add("non-subject");
        used = true;
      }
    }
    carry = mode;
    if (used) sentences.add(sentence);
  }

  const merged: PatternTerm[] = [];
  for (const t of terms) {
    if (merged.some((m) => termKey(m) === termKey(t))) continue;
    // "4xxx/5xxx EE and/or 4xxx/5xxx CSCI" is one term with two subjects.
    const same = merged.find((m) => m.subjects.length && t.subjects.length && !m.notSubjects.length && !t.notSubjects.length && m.levels.join() === t.levels.join() && !!m.orHigher === !!t.orHigher);
    if (same) same.subjects = [...new Set([...same.subjects, ...t.subjects])];
    else merged.push(t);
  }
  if (!merged.length) return null; // exclusions alone describe nothing to match
  return { terms: merged, exclude: [...exclude], include: [...include], forms: [...forms], sentences: [...sentences] };
}

const splitCode = (code: string) => code.toUpperCase().trim().match(/^([A-Z]{2,4})\s?(\d{4}[A-Z]?)$/);

function termMatches(t: PatternTerm, subject: string, digit: number): boolean {
  if (t.subjects.length && !t.subjects.includes(subject)) return false;
  if (t.notSubjects.includes(subject)) return false;
  if (!t.levels.length) return true;
  return t.orHigher ? digit >= t.levels[0] : t.levels.includes(digit);
}

/** Does a course code fit the pattern? Exclusions win over terms and includes. */
export function matchesPattern(pattern: CoursePattern, code: string | null | undefined): boolean {
  const parts = code ? splitCode(code) : null;
  if (!parts) return false;
  const normalized = `${parts[1]} ${parts[2]}`;
  const versions = equivalentCodes(normalized);
  if (versions.some((c) => pattern.exclude.includes(c))) return false;
  if (versions.some((c) => pattern.include.includes(c))) return true;
  return pattern.terms.some((t) => termMatches(t, parts[1], Number(parts[2][0])));
}

export interface PatternMatch {
  courseId: CourseId;
  code: string;
  credits: number;
}

/** Planned courses that fit the pattern, once each, in plan order. Display only. */
export function patternMatches(pattern: CoursePattern, planned: { courseId: CourseId; credits: number; code?: string | null }[]): PatternMatch[] {
  const out = new Map<CourseId, PatternMatch>();
  for (const p of planned) {
    if (p.code && !out.has(p.courseId) && matchesPattern(pattern, p.code)) out.set(p.courseId, { courseId: p.courseId, code: p.code, credits: p.credits });
  }
  return [...out.values()];
}

function levelLabel(t: PatternTerm): string {
  if (!t.levels.length) return "any level";
  return t.levels.map((d) => `${d}xxx`).join("/") + (t.orHigher ? " or higher" : "");
}

/** "EE/CSCI 4xxx/5xxx", "Any subject 3xxx", "Non-ARCH 3xxx or higher". */
export function describeTerm(t: PatternTerm): string {
  if (t.subjects.length) return `${t.subjects.join("/")} ${levelLabel(t)}`;
  if (t.notSubjects.length) return `Non-${t.notSubjects.join("/")} ${t.levels.length ? levelLabel(t) : "(any level)"}`;
  return `Any subject ${levelLabel(t)}`;
}

/** A course search the rail can open: one department (or any) at one search level (5000 = "5xxx and up"). */
export interface PatternSearch {
  dept?: string;
  level?: number;
  label: string;
}

/**
 * Searches that cover a term, one per subject and level, since the search filters take one of each.
 * "or higher" stops at 5000, which the search already reads as "5xxx and up".
 */
export function patternSearches(t: PatternTerm, max = 6): PatternSearch[] {
  const from = t.levels[0];
  const digits = t.orHigher && from ? Array.from({ length: Math.max(from, 5) - from + 1 }, (_, i) => from + i) : t.levels;
  const levels = [...new Set(digits.map((d) => Math.min(d, 5) * 1000))];
  const depts: (string | undefined)[] = t.subjects.length ? t.subjects : [undefined];
  const out: PatternSearch[] = [];
  if (!t.subjects.length && !levels.length) return []; // "any non-ARCH course": no filter narrows it
  for (const dept of depts) {
    for (const level of levels.length ? levels : [undefined]) {
      const lv = level === undefined ? "" : level === 5000 && (t.orHigher || t.levels.some((d) => d > 5)) ? "5xxx and up" : `${level / 1000}xxx`;
      out.push({ ...(dept ? { dept } : {}), ...(level ? { level } : {}), label: [dept ?? "Any", lv].filter(Boolean).join(" ") });
    }
  }
  return out.slice(0, max);
}
