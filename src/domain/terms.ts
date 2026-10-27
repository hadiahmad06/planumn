/**
 * UMN term codes ("strm"): "1" + two-digit year + season digit.
 *   Spring 2026 = "1263", Summer 2026 = "1265", Fall 2025 = "1259".
 * The same format is stored in 2025 plans (`Semester.index`), so keep it.
 */

export type Season = "spring" | "summer" | "fall";
export type TermCode = string;

const SEASON_DIGIT: Record<Season, string> = { spring: "3", summer: "5", fall: "9" };
const DIGIT_SEASON: Record<string, Season> = { "3": "spring", "5": "summer", "9": "fall" };
const SEASON_ORDER: Season[] = ["spring", "summer", "fall"];
const SEASON_LABEL: Record<Season, string> = { spring: "Spring", summer: "Summer", fall: "Fall" };

export interface Term {
  year: number;
  season: Season;
}

export function parseTerm(code: TermCode): Term {
  if (!/^1\d{2}[359]$/.test(code)) throw new Error(`Invalid term code: ${code}`);
  return { year: 2000 + Number(code.slice(1, 3)), season: DIGIT_SEASON[code[3]] };
}

export function toTermCode({ year, season }: Term): TermCode {
  return `1${String(year % 100).padStart(2, "0")}${SEASON_DIGIT[season]}`;
}

export function termLabel(code: TermCode): string {
  const { year, season } = parseTerm(code);
  return `${SEASON_LABEL[season]} ${year}`;
}

export function compareTerms(a: TermCode, b: TermCode): number {
  return Number(a) - Number(b);
}

export function nextTerm(code: TermCode): TermCode {
  const { year, season } = parseTerm(code);
  const i = SEASON_ORDER.indexOf(season);
  return i === SEASON_ORDER.length - 1
    ? toTermCode({ year: year + 1, season: "spring" })
    : toTermCode({ year, season: SEASON_ORDER[i + 1] });
}

export function previousTerm(code: TermCode): TermCode {
  const { year, season } = parseTerm(code);
  const i = SEASON_ORDER.indexOf(season);
  return i === 0
    ? toTermCode({ year: year - 1, season: "fall" })
    : toTermCode({ year, season: SEASON_ORDER[i - 1] });
}

/** Academic year a term belongs to: Fall 2025, Spring 2026 and Summer 2026 are all "2025–26". */
export function academicYear(code: TermCode): number {
  const { year, season } = parseTerm(code);
  return season === "fall" ? year : year - 1;
}

export function academicYearLabel(startYear: number): string {
  return `${startYear}–${String((startYear + 1) % 100).padStart(2, "0")}`;
}

/** New plans start on this calendar year's Fall (2025 behavior): the upcoming Fall, or the current one. */
export function defaultStartTerm(now = new Date()): TermCode {
  return toTermCode({ year: now.getFullYear(), season: "fall" });
}

/** `years` academic years of Fall, Spring, Summer starting at `start`. */
export function termRange(start: TermCode, years: number): TermCode[] {
  const terms: TermCode[] = [];
  let t = start;
  for (let i = 0; i < years * 3; i++) {
    terms.push(t);
    t = nextTerm(t);
  }
  return terms;
}

export function seasonOf(code: TermCode): Season {
  return parseTerm(code).season;
}
