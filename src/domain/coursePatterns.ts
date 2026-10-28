/**
 * Phase C/C3 (Hadi's Claude): course patterns read from a rule's catalog text, for rules whose course
 * list is empty because the catalog only describes it ("APEC 3xxx", "Complete additional 4xxx/5xxx EE
 * courses", "Any 4xxx or higher ESCI course", "Excluding: ACCT 2051, …").
 *
 * Hadi, 2026-10-28: **show first**. Planned courses that match are listed, labelled "read from catalog
 * text", and never counted toward progress until C4 agrees with APAS. Every rule here has a row in
 * `docs/agent/heuristics.md`.
 */

export interface PatternSubject {
  /** "APEC"; "*" = any subject (the catalog writes "xxxx 3xxx"). */
  subject: string;
  /** First digit of the course number: 3 = 3xxx. Ascending, no repeats. */
  levels: number[];
}

export interface CoursePattern {
  subjects: PatternSubject[];
  /** Codes the text excludes ("EE 4981H"), uppercased. */
  excluded: string[];
  /** Codes the text adds outside the pattern ("Includes CSCI 4203"), uppercased. */
  included: string[];
  /** Subjects the text rules out ("Upper-Division Electives: non-ARCH"). */
  exceptSubjects: string[];
  /** The text the pattern was read from, shown on hover. */
  sentence: string;
}

/** Highest level an "or higher" pattern reaches (8xxx are graduate courses). */
const TOP_LEVEL = 8;
// "5000" counts only as "5000 level", so a real course number like "ENGL 3000" isn't read as a level.
const LEVEL = String.raw`([1-9])(?:xxx|XXX|000(?=[- ]level))(?:[- ]level)?`;
const SUBJECT = String.raw`([A-Z]{2,5}|xxxx|XXXX)`;
const HIGHER = String.raw`(?:\s+(?:or|and)\s+(?:higher|above))`;
const SEP = String.raw`\s*(?:-|–|/|,|\bor\b|\band\b|\bto\b)\s*`;
const CODE = /\b([A-Za-z]{2,5})\s?(\d{4}[A-Z]?)\b/g;

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

function add(found: Map<string, Set<number>>, subject: string, levels: number[]) {
  const key = /^x{4}$/i.test(subject) ? "*" : subject;
  const set = found.get(key) ?? new Set<number>();
  levels.forEach((l) => set.add(l));
  found.set(key, set);
}

/** "4xxx-5xxx" → [4, 5]; "3xxx/5xxx" → [3, 5]; "4xxx or higher" → [4 … 8]. */
function levelsOf(list: string, higher: boolean): number[] {
  const matches = [...list.matchAll(/([1-9])(?:xxx|000)/gi)];
  const parts = matches.map((m) => Number(m[1]));
  const out = new Set<number>();
  matches.forEach((m, i) => {
    out.add(parts[i]);
    // A dash or "to" between two levels is a range ("4xxx-5xxx", "3xxx to 5xxx").
    const prev = matches[i - 1];
    const between = prev ? list.slice((prev.index ?? 0) + prev[0].length, m.index) : "";
    if (prev && /-|–|\bto\b/.test(between)) range(parts[i - 1], parts[i]).forEach((x) => out.add(x));
  });
  if (higher && parts.length) range(Math.max(...parts), TOP_LEVEL).forEach((x) => out.add(x));
  return [...out].sort((a, b) => a - b);
}

/** Codes after "Excluding"/"Excludes" (or "Including"/"Includes") up to the end of that sentence. */
function codesAfter(text: string, word: RegExp): string[] {
  const codes = new Set<string>();
  for (const m of text.matchAll(word)) {
    const rest = text.slice((m.index ?? 0) + m[0].length);
    const end = rest.search(/\.(\s|$)|\b(?:includ|exclud)/i);
    for (const c of (end < 0 ? rest : rest.slice(0, end)).matchAll(CODE)) codes.add(`${c[1].toUpperCase()} ${c[2].toUpperCase()}`);
  }
  return [...codes];
}

/**
 * Read a course pattern from catalog text, or null when it names none. Subjects must be written in
 * capitals ("EE", "APEC"), so words like "of 4xxx" aren't read as subjects; "non-EE" is skipped.
 */
export function readCoursePattern(text: string | null | undefined): CoursePattern | null {
  if (!text) return null;
  // A cap ("may not exceed 16 credits of EE 5000 level coursework") limits courses; it doesn't list them.
  if (/\b(?:may not exceed|maximum of|no more than|at most|up to)\b/i.test(text)) return null;
  const found = new Map<string, Set<number>>();
  // "APEC 3xxx", "ANTH 4xxx-5xxx", "ANTH 4xxx or ANTH 5xxx", "EE 5000 level", "ESCI 4xxx or higher"
  const sameSubjectLevels = String.raw`(${LEVEL}(?:${SEP}(?:\1\s+)?${LEVEL})*)`;
  for (const m of text.matchAll(new RegExp(String.raw`(?<![-\w])${SUBJECT}\s+${sameSubjectLevels}(${HIGHER})?`, "g"))) {
    add(found, m[1], levelsOf(m[2], Boolean(m.at(-1))));
  }
  // "4xxx/5xxx EE/CSCI", "4xxx or higher ESCI", "5xxx-level SPAN"
  const subjects = String.raw`([A-Z]{2,5}(?:\s*(?:\/|\band\/or\b|\bor\b|\band\b)\s*[A-Z]{2,5})*)\b`;
  const levelList = String.raw`(${LEVEL}(?:${SEP}${LEVEL})*)`;
  for (const m of text.matchAll(new RegExp(String.raw`(?<![\w-])${levelList}(${HIGHER})?(?:\s+electives)?\s+${subjects}`, "g"))) {
    const subjectList = m.at(-1)!;
    const before = text.slice(0, m.index ?? 0);
    // "non-EE 4000 level"; "ACCT 5XXX BLAW 3XXX" (a level that belongs to the subject before it).
    if (/non-\s*$/i.test(before) || /(?:\b[A-Z]{2,5}|[xX]{4})\s+$/.test(before)) continue;
    for (const s of subjectList.split(/\s*(?:\/|\band\/or\b|\bor\b|\band\b)\s*/)) {
      if (/^[A-Z]{2,5}$/.test(s)) add(found, s, levelsOf(m[1], Boolean(m.at(-2))));
    }
  }
  if (!found.size) return null;
  return {
    subjects: [...found].map(([subject, levels]) => ({ subject, levels: [...levels].sort((a, b) => a - b) })),
    exceptSubjects: [...new Set([...text.matchAll(/\bnon-([A-Z]{2,5})\b/g)].map((m) => m[1]))],
    excluded: codesAfter(text, /\bexclud(?:ing|es|e)\b\s*:?/gi),
    included: codesAfter(text, /\binclud(?:ing|es|e)\b\s*:?/gi),
    sentence: text.length > 400 ? `${text.slice(0, 399)}…` : text,
  };
}

/** Does a course code ("APEC 3011", "EE 4981H") match the pattern? Exclusions win over everything. */
export function matchesPattern(pattern: CoursePattern, code: string): boolean {
  const c = code.toUpperCase().replace(/\s+/g, " ").trim();
  if (pattern.excluded.includes(c)) return false;
  if (pattern.included.includes(c)) return true;
  const m = /^([A-Z]{2,5}) (\d)\d{3}/.exec(c);
  if (!m) return false;
  const level = Number(m[2]);
  if (pattern.exceptSubjects.includes(m[1])) return false;
  return pattern.subjects.some((s) => (s.subject === "*" || s.subject === m[1]) && s.levels.includes(level));
}

/** "APEC 3xxx–5xxx", "EE or CSCI 4xxx/5xxx", "any subject 3xxx". */
export function describePattern(pattern: CoursePattern): string {
  const levels = (ls: number[]) =>
    ls.length > 2 && ls.every((l, i) => i === 0 || l === ls[i - 1] + 1) ? `${ls[0]}xxx–${ls.at(-1)}xxx` : ls.map((l) => `${l}xxx`).join("/");
  const groups = new Map<string, string[]>();
  for (const s of pattern.subjects) groups.set(levels(s.levels), [...(groups.get(levels(s.levels)) ?? []), s.subject === "*" ? "any subject" : s.subject]);
  return [...groups].map(([l, subjects]) => `${subjects.join(" or ")} ${l}`).join("; ");
}
