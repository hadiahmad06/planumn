import type { SearchFilters } from "./searchFilters";
import type { Season } from "./terms";

/**
 * Natural-language course search (Phase B: B27). Written by Hadi's Claude.
 *
 * Rule-based, no LLM (the AI chatbot is parked in Phase Z): recognizable phrases become the B8 search
 * filters and whatever is left is searched in titles. "easy 3 credit fall classes with no prereqs for
 * global perspectives" → avg GPA 3.5+, 3 credits, offered in Fall, no prerequisites, Lib Ed GP.
 * Plain searches ("csci 2041", "discrete structures", "math") return null and keep working as before.
 */
export interface Department {
  code: string;
  name: string;
}

export interface Understood {
  key: keyof SearchFilters;
  label: string;
}

export interface NaturalQuery {
  /** Words left for the title search (may be empty). */
  text: string;
  filters: SearchFilters;
  understood: Understood[];
}

const SEASON_LABEL: Record<Season, string> = { fall: "Fall", spring: "Spring", summer: "Summer" };

/** Phrases per Twin Cities CLE code. Generic words ("global", "environment") alone stay title words. */
const LIBED_PHRASES: [string, string, string][] = [
  ["GP", "Global Perspectives", "global perspectives?"],
  ["WI", "Writing Intensive", "writing[- ]intensive|wi"],
  ["TS", "Technology and Society", "tech(?:nology)? (?:and|&) society"],
  ["CIV", "Civic Life and Ethics", "civic life(?: (?:and|&) ethics)?"],
  ["DSJ", "Race, Power, and Justice", "race,? power,? (?:and|&) justice|diversity (?:and|&) social justice"],
  ["ENV", "The Environment", "(?:the )?environment (?:theme|lib ?ed)|lib ?ed environment"],
  ["HIS", "Historical Perspectives", "historical perspectives?"],
  ["AH", "Arts/Humanities", "arts? ?(?:/|and|&) ?humanities"],
  ["LITR", "Literature", "literature (?:core|lib ?ed)|lib ?ed literature"],
  ["MATH", "Mathematical Thinking", "mathematical thinking"],
  ["PHYS", "Physical Sciences", "physical sciences? (?:core|lib ?ed)|lib ?ed physical sciences?"],
  ["BIOL", "Biological Sciences", "biological sciences? (?:core|lib ?ed)|lib ?ed biological sciences?"],
  ["SOCS", "Social Sciences", "social sciences? (?:core|lib ?ed)|lib ?ed social sciences?"],
];

const STOP = new Set(
  ("a an the and or of for to in on at with without that which what who are is be i me my we want need looking find show " +
    "give some any good great classes class courses course credits credit cr offered taught level semester term during " +
    "lib ed libed theme core requirement requirements counts count satisfies satisfy fulfill fulfills fills only like also").split(" "),
);

function take(state: { q: string }, re: RegExp): RegExpExecArray | null {
  const m = re.exec(state.q);
  if (m) state.q = (state.q.slice(0, m.index) + " " + state.q.slice(m.index + m[0].length)).replace(/\s+/g, " ");
  return m;
}

export function parseNaturalQuery(raw: string, departments: readonly Department[] = []): NaturalQuery | null {
  const original = raw.trim();
  // Course codes and bare numbers are the regular search's job.
  if (!original || /^[a-z]{2,4}\s?\d{1,4}[a-z]?$/i.test(original) || /^\d{1,4}[a-z]?$/i.test(original)) return null;
  const state = { q: ` ${original.toLowerCase().replace(/[?!;,]|\.(?!\d)/g, " ").replace(/\s+/g, " ")} ` };
  const filters: SearchFilters = {};
  const understood: Understood[] = [];

  const credits = take(state, /\b(\d{1,2})[ -]?(?:credits?|cr|credit[ -]hours?)\b/);
  if (credits && Number(credits[1]) > 0) {
    filters.credits = Number(credits[1]);
    understood.push({ key: "credits", label: `${filters.credits} credit${filters.credits === 1 ? "" : "s"}` });
  }

  if (take(state, /\b(?:no|without|zero|not any) (?:pre-?req(?:uisite)?s?)\b|\bno prior (?:courses|experience)\b/)) {
    filters.noPrereqs = true;
    understood.push({ key: "noPrereqs", label: "No prerequisites" });
  }

  const gpa = take(state, /\b(?:avg |average )?gpa (?:above|over|of at least|at least|>=?|of)? ?([0-4](?:\.\d{1,2})?)\b/);
  if (gpa) filters.minGpa = Number(gpa[1]);
  else if (take(state, /\beasiest\b/)) filters.minGpa = 3.75;
  else if (take(state, /\b(?:easy|easier|gpa boosters?|high gpa|chill)\b/)) filters.minGpa = 3.5;
  if (filters.minGpa !== undefined) understood.push({ key: "minGpa", label: `Avg GPA ${filters.minGpa.toFixed(2)}+` });

  const level =
    take(state, /\b([1-5])xxx\b/) ??
    take(state, /\b([1-5])000[ -]?level\b/) ??
    take(state, /\blevel ([1-5])000\b/);
  if (level) filters.level = Number(level[1]) * 1000;
  else if (take(state, /\b(?:intro(?:ductory)?|beginner|freshman|first[- ]year)\b/)) filters.level = 1000;
  else if (take(state, /\bgrad(?:uate)?(?:[- ]level)?\b/)) filters.level = 5000;
  if (filters.level !== undefined) understood.push({ key: "level", label: filters.level === 5000 ? "5xxx and up" : `${filters.level / 1000}xxx` });

  for (const [code, label, phrase] of LIBED_PHRASES) {
    if (take(state, new RegExp(`\\b(?:${phrase})\\b`))) {
      filters.libEd = code;
      understood.push({ key: "libEd", label: `Lib Ed: ${label}` });
      break;
    }
  }

  const season = take(state, /\b(?:in (?:the )?)?(fall|autumn|spring|summer)\b/);
  if (season) {
    filters.season = (season[1] === "autumn" ? "fall" : season[1]) as Season;
    understood.push({ key: "season", label: `Offered in ${SEASON_LABEL[filters.season]}` });
  }

  // Departments: full names first ("computer science"), longest match wins; then a bare code word.
  const byLength = [...departments].sort((a, b) => b.name.length - a.name.length);
  const dept =
    byLength.find((d) => take(state, new RegExp(`\\b${d.name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`))) ??
    departments.find((d) => d.code.length >= 3 && !STOP.has(d.code.toLowerCase()) && take(state, new RegExp(`\\b${d.code.toLowerCase()}\\b`)));
  if (dept) {
    filters.dept = dept.code;
    understood.push({ key: "dept", label: `${dept.name} (${dept.code})` });
  }

  const text = state.q
    .split(" ")
    .filter((w) => w && !STOP.has(w) && !/^\d+$/.test(w))
    .join(" ");
  // A lone department ("math") is already handled well by the regular search.
  if (understood.length === 0 || (understood.length === 1 && dept && !text && !original.includes(" "))) return null;
  return { text, filters, understood };
}
