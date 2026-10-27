import type { CourseOption, Program, Requirement, RequirementLevel, Rule } from "@/domain/requirements";

/** Raw CourseDog shapes (only the fields we read). */
export interface RawValueEntry {
  value?: string[] | string;
  logic?: string;
}
export interface RawRule {
  id?: string;
  name?: string;
  condition?: string;
  notes?: string;
  /** C1: the catalog's explanation, often the only place credit totals are stated. */
  description?: string;
  /** numberOf: how many sub-rules must be completed. */
  number?: number;
  /** numberOf: courses needed across them (CourseDog "restriction"). */
  restriction?: number;
  minCourses?: number;
  maxCourses?: number;
  minCredits?: number;
  maxCredits?: number;
  credits?: number;
  courses?: number;
  value?: { condition?: string; values?: RawValueEntry[] } | string | null;
  subRules?: RawRule[];
}
export interface RawGroup {
  id?: string;
  name?: string;
  notes?: string;
  requirementLevel?: string;
  rules?: RawRule[];
}
export interface RawRequirementLevel {
  key?: string;
  label?: string;
  notes?: string | null;
}
export interface RawProgram {
  _id?: string;
  name?: string;
  /** `cdSamplePlanLink` is HTML: `<p><a href="https://sampleplan.umn.edu/node/666">…</a></p>` (B17). */
  customFields?: { cdSamplePlanLink?: string | null };
  catalogDisplayName?: string;
  type?: string;
  programGroupId?: string;
  effectiveStartDate?: string;
  requisites?: Record<string, RawGroup[]>;
  requirementLevels?: RawRequirementLevel[];
}

const LEVELS: Record<string, RequirementLevel> = {
  programAdmissionRequirements: "admission",
  programSubPlanRequirements: "subplan",
};

/** Turns a CourseDog course group id into an option (catalog lookup + CourseDog names). */
export type ResolveOption = (groupId: string) => CourseOption;

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'", nbsp: " " };

/** CourseDog notes are HTML. Keep paragraph breaks, drop tags. */
export function htmlToText(html: string | undefined | null): string | null {
  if (!html) return null;
  const text = html
    .replace(/<\s*(br|\/p|\/li|\/div)\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#\d+|#x[0-9a-f]+|\w+);/gi, (m, e: string) => {
      if (e.startsWith("#x")) return String.fromCodePoint(Number.parseInt(e.slice(2), 16));
      if (e.startsWith("#") && e !== "#39") return String.fromCodePoint(Number(e.slice(1)));
      return ENTITIES[e.toLowerCase()] ?? m;
    })
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
  return text || null;
}

/** The https links in a CourseDog HTML note, labeled by their text (B26: application pages). */
export function htmlLinks(html: string | undefined | null): { label: string; url: string }[] {
  const links = new Map<string, string>();
  for (const m of (html ?? "").matchAll(/<a\b[^>]*href="(https:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const url = m[1].replace(/&amp;/g, "&");
    if (!links.has(url)) links.set(url, htmlToText(m[2]) ?? url);
  }
  return [...links].map(([url, label]) => ({ label, url }));
}

/** Every course group id a raw program mentions, so they can be resolved in one batch. */
export function collectGroupIds(program: RawProgram): string[] {
  const ids = new Set<string>();
  const visit = (r: RawRule) => {
    if (r.value && typeof r.value === "object") {
      for (const v of r.value.values ?? []) for (const id of [v.value ?? []].flat()) if (typeof id === "string") ids.add(id);
    }
    r.subRules?.forEach(visit);
  };
  Object.values(program.requisites ?? {}).flat().forEach((g) => g.rules?.forEach(visit));
  return [...ids];
}

function normalizeRule(r: RawRule, resolve: ResolveOption, path: string): Rule {
  const description = htmlToText(r.description);
  const base = {
    id: r.id ?? path,
    name: (r.name ?? "").trim() || "Requirement",
    notes: htmlToText(r.notes),
    ...(description ? { description } : {}),
  };
  const children = () => (r.subRules ?? []).map((s, i) => normalizeRule(s, resolve, `${path}.${i}`));
  if (r.condition === "anyOf" || r.condition === "allOf") return { ...base, kind: r.condition, children: children() };
  if (r.condition === "numberOf") {
    // C1: "complete N of these" (EE Breadth and Depth: number 4 areas, restriction 5 courses).
    const total = r.restriction ?? r.minCourses ?? 0;
    return { ...base, kind: "numberOf", children: children(), count: r.number ?? 1, ...(total > 0 ? { totalCourses: total } : {}) };
  }
  if (typeof r.value === "string" || r.condition === "freeformText") {
    return { ...base, kind: "text", text: htmlToText(typeof r.value === "string" ? r.value : "") ?? "" };
  }
  const choices = (r.value?.values ?? []).map((v) => ({
    options: [v.value ?? []].flat().filter((id): id is string => typeof id === "string").map(resolve),
  }));
  let minCourses: number;
  let minCredits: number;
  switch (r.condition) {
    case "completeCourses":
      minCourses = choices.length;
      minCredits = 0;
      break;
    case "minimumCourses":
      minCourses = r.minCourses ?? r.courses ?? 1;
      minCredits = 0;
      break;
    case "minimumCredits":
      minCourses = r.minCourses ?? 0;
      minCredits = r.minCredits ?? r.credits ?? 0;
      break;
    default:
      // completeVariableCoursesAndVariableCredits and anything unknown: "N courses and/or M credits".
      minCredits = r.minCredits ?? 0;
      minCourses = r.minCourses ?? (minCredits > 0 || r.maxCredits !== undefined ? 0 : Math.min(r.maxCourses ?? 1, choices.length));
  }
  return { ...base, kind: "courses", choices, minCourses, minCredits };
}

export function normalizeProgram(raw: RawProgram, resolve: ResolveOption): Program {
  const groups = Object.values(raw.requisites ?? {}).flat();
  const requirements: Requirement[] = groups.map((g, i) => ({
    id: g.id ?? `req-${i}`,
    name: (g.name ?? "").trim() || "Requirement",
    notes: htmlToText(g.notes),
    rules: (g.rules ?? []).map((r, j) => normalizeRule(r, resolve, `req-${i}.${j}`)),
    ...(g.requirementLevel && LEVELS[g.requirementLevel] ? { level: LEVELS[g.requirementLevel] } : {}),
  }));
  const admission = raw.requirementLevels?.find((l) => l.key === "programAdmissionRequirements");
  return {
    id: raw.programGroupId ?? "",
    name: raw.catalogDisplayName ?? raw.name ?? "Program",
    type: raw.type ?? "",
    requirements,
    admissionNotes: htmlToText(admission?.notes),
    admissionLinks: htmlLinks(admission?.notes),
  };
}

/** CourseDog returns one entry per effective version; use the newest that has started. */
export function pickCurrentVersion(response: Record<string, RawProgram>, today = new Date()): RawProgram | null {
  const versions = Object.values(response);
  if (versions.length === 0) return null;
  const iso = today.toISOString().slice(0, 10);
  const started = versions.filter((v) => (v.effectiveStartDate ?? "") <= iso);
  const pool = started.length ? started : versions;
  return pool.sort((a, b) => (b.effectiveStartDate ?? "").localeCompare(a.effectiveStartDate ?? ""))[0];
}

/**
 * The first https link to a umn.edu site in the catalog's sample-plan field (B17). Anything else
 * (no link, http, another host) is dropped rather than linked.
 */
export function samplePlanUrl(raw: RawProgram): string | undefined {
  for (const m of (raw.customFields?.cdSamplePlanLink ?? "").matchAll(/href="([^"]+)"/gi)) {
    const href = m[1].replace(/&amp;/g, "&");
    try {
      const url = new URL(href);
      if (url.protocol === "https:" && (url.hostname === "umn.edu" || url.hostname.endsWith(".umn.edu"))) return url.href;
    } catch {
      // Not a URL; try the next link.
    }
  }
  return undefined;
}
