import type { CreditRange } from "./course";
import { TWIN_CITIES_LIBED } from "./libed";
import type { Season } from "./terms";

/**
 * Smart search filters (Phase B: B8). Written by Hadi's Claude.
 *
 * Every filter is optional; a search needs a query or at least one filter. Offering seasons and average
 * GPA come from historical grades (GopherGrades, through Fall 2024), so they are hints, not schedules.
 * Lib Ed designations come from the UMN catalog (CourseDog), not the bundled catalog's tags (see B3).
 */
export interface SearchFilters {
  /** Twin Cities CLE code, e.g. "GP". */
  libEd?: string;
  /** Historically offered in this season. */
  season?: Season;
  /** Course level: 1000–4000, or 5000 for 5000 and above. */
  level?: number;
  /** The course can be taken for this many credits. */
  credits?: number;
  /** Minimum average GPA (courses without enough grade data are excluded). */
  minGpa?: number;
  /** Only courses whose catalog description lists no prerequisites. */
  noPrereqs?: boolean;
  /**
   * Only these catalog courses: "satisfies requirement X", resolved on the client from the
   * requirement's listed courses. An empty list matches nothing.
   */
  courseIds?: number[];
  /** Department code, e.g. "CSCI" (B27: "computer science classes"). */
  dept?: string;
}

/** Most course ids one search takes (`ids=`); program requirements list far fewer. */
export const MAX_FILTER_IDS = 1000;

export const LEVELS = [1000, 2000, 3000, 4000, 5000] as const;
export const SEASONS: Season[] = ["fall", "spring", "summer"];
export const MIN_GPAS = [2.5, 3, 3.25, 3.5, 3.75] as const;
const LIBED_CODES = new Set(TWIN_CITIES_LIBED.map((d) => d.code));

/** What the server knows about one course, enough to apply every filter but Lib Ed. */
export interface CourseFacts {
  number: string;
  credits: CreditRange;
  /** Seasons with recorded grades; null when there's too little history to judge. */
  seasons: Season[] | null;
  gpa: number | null;
  hasPrereqs: boolean;
}

export function hasFilters(f: SearchFilters): boolean {
  return Object.values(f).some((v) => v !== undefined && v !== false);
}

export function levelOf(number: string): number {
  const n = Number.parseInt(number, 10);
  return Number.isNaN(n) ? 0 : Math.min(Math.floor(n / 1000) * 1000, 5000);
}

/** All filters except Lib Ed, which needs the UMN catalog and is applied by the caller. */
export function matchesFilters(c: CourseFacts, f: SearchFilters): boolean {
  if (f.level !== undefined && levelOf(c.number) !== f.level) return false;
  if (f.credits !== undefined && (f.credits < c.credits.min || f.credits > c.credits.max)) return false;
  if (f.season !== undefined && !c.seasons?.includes(f.season)) return false;
  if (f.minGpa !== undefined && (c.gpa === null || c.gpa < f.minGpa)) return false;
  if (f.noPrereqs && c.hasPrereqs) return false;
  return true;
}

/** Query-string form, shared by the API route and the client. Empty filters are omitted. */
export function filtersToParams(f: SearchFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.libEd) p.set("libed", f.libEd);
  if (f.season) p.set("season", f.season);
  if (f.level !== undefined) p.set("level", String(f.level));
  if (f.credits !== undefined) p.set("credits", String(f.credits));
  if (f.minGpa !== undefined) p.set("minGpa", String(f.minGpa));
  if (f.noPrereqs) p.set("noPrereqs", "1");
  if (f.dept) p.set("dept", f.dept);
  if (f.courseIds) p.set("ids", [...f.courseIds].sort((a, b) => a - b).join(","));
  return p;
}

/** Inverse of `filtersToParams`. Returns an error message for an invalid value. */
export function parseFilters(p: URLSearchParams): SearchFilters | { error: string } {
  const f: SearchFilters = {};
  const libEd = p.get("libed");
  if (libEd) {
    if (!LIBED_CODES.has(libEd)) return { error: `Unknown Lib Ed designation: ${libEd}` };
    f.libEd = libEd;
  }
  const season = p.get("season");
  if (season) {
    if (!SEASONS.includes(season as Season)) return { error: "season must be fall, spring or summer" };
    f.season = season as Season;
  }
  const level = p.get("level");
  if (level) {
    if (!(LEVELS as readonly number[]).includes(Number(level))) return { error: "level must be 1000, 2000, 3000, 4000 or 5000" };
    f.level = Number(level);
  }
  const credits = p.get("credits");
  if (credits) {
    if (!/^\d{1,2}$/.test(credits)) return { error: "credits must be a whole number" };
    f.credits = Number(credits);
  }
  const minGpa = p.get("minGpa");
  if (minGpa) {
    const n = Number(minGpa);
    if (!Number.isFinite(n) || n < 0 || n > 4) return { error: "minGpa must be between 0 and 4" };
    f.minGpa = n;
  }
  const noPrereqs = p.get("noPrereqs");
  if (noPrereqs === "1" || noPrereqs === "true") f.noPrereqs = true;
  const dept = p.get("dept");
  if (dept) {
    if (!/^[A-Z]{2,4}$/.test(dept)) return { error: "dept must be a department code, e.g. CSCI" };
    f.dept = dept;
  }
  const ids = p.get("ids");
  if (ids !== null) {
    const list = ids.split(",").filter(Boolean);
    if (list.some((x) => !/^\d{1,9}$/.test(x) || Number(x) === 0)) return { error: "ids must be course ids, e.g. ids=77,1473" };
    if (list.length > MAX_FILTER_IDS) return { error: `At most ${MAX_FILTER_IDS} ids per search` };
    f.courseIds = [...new Set(list.map(Number))];
  }
  return f;
}
