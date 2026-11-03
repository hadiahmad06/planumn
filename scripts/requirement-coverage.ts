/**
 * Phase C/C0 (Hadi's Claude): requirement coverage report.
 *
 *   node scripts/requirement-coverage.ts            # writes docs/agent/requirement-coverage.md
 *
 * Fetches every program in programOptions.json from CourseDog **one request at a time**, with a pause
 * between requests, and caches each response under `.cache/coursedog/` so reruns hit the network
 * only for what's missing (delete the folder to refresh). Course ids are looked up in data/catalog.db
 * first, then in batches through CourseDog's course search (which also matches old 20-character ids).
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import programOptions from "../src/features/requirements/programOptions.json" with { type: "json" };
import { analyzeProgram, HANDLED_CONDITIONS, type IdStatus, type ProgramCoverage } from "../src/server/programs/coverage.ts";
import { collectGroupIds, pickCurrentVersion, type RawProgram } from "../src/server/programs/normalize.ts";

const BASE = "https://app.coursedog.com/api/v1/cm/umn_umntc_peoplesoft";
const HEADERS = {
  Accept: "application/json",
  Origin: "https://umtc.catalog.prod.coursedog.com",
  Referer: "https://umtc.catalog.prod.coursedog.com/",
  "x-requested-with": "catalog",
};
const PAUSE_MS = 750;
const COURSE_BATCH = 50;
const CACHE = path.join(process.cwd(), ".cache", "coursedog");
const OUT = path.join(process.cwd(), "docs", "agent", "requirement-coverage.md");

mkdirSync(path.join(CACHE, "programs"), { recursive: true });
mkdirSync(path.join(CACHE, "courses"), { recursive: true });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** GET with a file cache; network requests are strictly sequential and spaced out. */
async function cachedJson<T>(file: string, url: string): Promise<T> {
  if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8")) as T;
  for (let attempt = 1; ; attempt++) {
    await sleep(PAUSE_MS * attempt);
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(20_000) }).catch((e: unknown) => e as Error);
    if (!(res instanceof Error) && res.ok) {
      const body = (await res.json()) as T;
      writeFileSync(file, JSON.stringify(body));
      return body;
    }
    if (attempt >= 3) throw new Error(`${url}: ${res instanceof Error ? res.message : res.status}`);
  }
}

const today = new Date().toISOString().slice(0, 10);
const later = `${Number(today.slice(0, 4)) + 7}-12-31`;

async function fetchProgram(id: string): Promise<RawProgram | null> {
  const url =
    `${BASE}/programs?programGroupIds=${encodeURIComponent(id)}&effectiveDatesRange=${today}%2C${later}` +
    "&doNotDisplayAllMappedRevisionsAsDependencies=true&formatDependents=true&includeMappedDocumentItems=true";
  return pickCurrentVersion(await cachedJson<Record<string, RawProgram>>(path.join(CACHE, "programs", `${id}.json`), url));
}

interface FoundCourse {
  courseGroupId: string;
  deprecatedCourseGroupId?: string | null;
}

async function fetchCourses(ids: string[], batch: number): Promise<FoundCourse[]> {
  const url =
    `${BASE}/courses/search/%24filters?courseGroupIds=${ids.map(encodeURIComponent).join(",")}` +
    `&limit=${ids.length * 3 + 20}&columns=courseGroupId,deprecatedCourseGroupId`;
  const body = await cachedJson<{ data?: FoundCourse[] }>(path.join(CACHE, "courses", `${batch}-${ids[0]}.json`), url);
  return body.data ?? [];
}

const isCourseDogId = (id: string) => /^(\d{7}|[A-Za-z0-9]{20})$/.test(id);

async function main() {
  const programs: RawProgram[] = [];
  const failed: string[] = [];
  for (const [i, opt] of programOptions.entries()) {
    try {
      const raw = await fetchProgram(opt.id);
      if (raw) programs.push(raw);
      else failed.push(`${opt.name} (no current version)`);
    } catch (e) {
      failed.push(`${opt.name} (${(e as Error).message})`);
    }
    if ((i + 1) % 50 === 0) console.error(`programs ${i + 1}/${programOptions.length}`);
  }

  // Resolve every id once: catalog first, then CourseDog for the rest.
  const allIds = [...new Set(programs.flatMap(collectGroupIds))].sort();
  const db = new DatabaseSync(path.join(process.cwd(), "data", "catalog.db"), { readOnly: true });
  const inCatalog = new Set<string>();
  for (let i = 0; i < allIds.length; i += 500) {
    const chunk = allIds.slice(i, i + 500);
    const rows = db
      .prepare(`SELECT DISTINCT courseGroupId FROM classdistribution WHERE campus = 'UMNTC' AND courseGroupId IN (${chunk.map(() => "?").join(",")})`)
      .all(...chunk) as { courseGroupId: string }[];
    for (const r of rows) inCatalog.add(r.courseGroupId);
  }
  const status = new Map<string, IdStatus>();
  const lookup = allIds.filter((id) => !inCatalog.has(id) && isCourseDogId(id));
  for (let i = 0; i < lookup.length; i += COURSE_BATCH) {
    const chunk = lookup.slice(i, i + COURSE_BATCH);
    for (const c of await fetchCourses(chunk, i / COURSE_BATCH)) {
      if (chunk.includes(c.courseGroupId)) status.set(c.courseGroupId, "coursedog");
      if (c.deprecatedCourseGroupId && chunk.includes(c.deprecatedCourseGroupId) && !status.has(c.deprecatedCourseGroupId)) {
        status.set(c.deprecatedCourseGroupId, "old");
      }
    }
  }
  const idStatus = (id: string): IdStatus => (inCatalog.has(id) ? "catalog" : (status.get(id) ?? "unresolved"));

  const results = programs.map((p) => analyzeProgram(p, idStatus));
  writeFileSync(OUT, render(results, failed, allIds.length));
  console.error(`wrote ${path.relative(process.cwd(), OUT)} (${results.length} programs, ${failed.length} failed)`);
}

const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");

function render(results: ProgramCoverage[], failed: string[], uniqueIds: number): string {
  const sum = (f: (r: ProgramCoverage) => number) => results.reduce((n, r) => n + f(r), 0);
  const count = (f: (r: ProgramCoverage) => boolean) => results.filter(f).length;
  const conditions = new Map<string, { rules: number; programs: number }>();
  for (const r of results) {
    for (const [c, n] of Object.entries(r.conditions)) {
      const e = conditions.get(c) ?? { rules: 0, programs: 0 };
      conditions.set(c, { rules: e.rules + n, programs: e.programs + 1 });
    }
  }
  const idTotals: Record<IdStatus, number> = { catalog: 0, coursedog: 0, old: 0, unresolved: 0 };
  for (const r of results) for (const k of Object.keys(idTotals) as IdStatus[]) idTotals[k] += r.ids[k];
  const unresolvedUnique = new Set(results.flatMap((r) => r.unresolvedIds));

  const lines: string[] = [];
  const p = (s = "") => lines.push(s);
  p("# Requirement coverage (Phase C/C0)");
  p();
  p(`> Generated by **Hadi's Claude** with \`node scripts/requirement-coverage.ts\` on ${today}, from \`v2/main\`'s normalizer.`);
  p("> Rerun the script after C1–C3 land to measure progress; don't hand-edit the numbers.");
  p();
  p(
    `${results.length} of ${results.length + failed.length} programs in \`programOptions.json\` fetched from CourseDog, ` +
      `${sum((r) => r.rules)} rules, ${uniqueIds} distinct course ids.`,
  );
  p();
  p("## Summary");
  p();
  p("| What | Rules | Programs |");
  p("|---|---|---|");
  p(`| Conditions the normalizer has no case for | ${sum((r) => r.unhandled.length)} | ${count((r) => r.unhandled.length > 0)} |`);
  p(`| \`freeformText\` rules (prose only, nothing checkable) | ${sum((r) => r.freeform.length)} | ${count((r) => r.freeform.length > 0)} |`);
  p(`| Credit counts only in \`description\`/notes (no \`minCredits\`/\`maxCredits\`/\`credits\`) | ${sum((r) => r.proseOnlyCredits.length)} | ${count((r) => r.proseOnlyCredits.length > 0)} |`);
  p(`| Course rules that normalize to **no options** | ${sum((r) => r.emptyCourseRules.length)} | ${count((r) => r.emptyCourseRules.length > 0)} |`);
  p(`| Programs with an unresolved course id | — | ${count((r) => r.unresolvedIds.length > 0)} |`);
  p();
  p("### Course ids (per program mention)");
  p();
  p("| Resolves to | Mentions | Meaning |");
  p("|---|---|---|");
  p(`| \`data/catalog.db\` | ${idTotals.catalog} | plannable |`);
  p(`| CourseDog, current id | ${idTotals.coursedog} | shown by name, "isn't in planu.mn's course data yet" |`);
  p(`| CourseDog, **old** id (\`deprecatedCourseGroupId\`) | ${idTotals.old} | blank on \`v2/main\`; resolved by #80 (C1c) |`);
  p(`| Nothing | ${idTotals.unresolved} (${unresolvedUnique.size} distinct) | shown as "Other approved course" |`);
  p();
  p("### Rule conditions");
  p();
  p("| Condition | Rules | Programs | Normalizer |");
  p("|---|---|---|---|");
  for (const [c, e] of [...conditions].sort((a, b) => b[1].rules - a[1].rules)) {
    const how = HANDLED_CONDITIONS.has(c) ? "handled" : c === "numberOf" ? "generic default on `v2/main`; handled by #79 (C1)" : "**generic default**";
    p(`| \`${c}\` | ${e.rules} | ${e.programs} | ${how} |`);
  }
  p();
  p(
    "The generic default reads a rule as \"`minCourses` courses and/or `minCredits` credits\" from its course list. " +
      "`completed*` rules carry an ordinary course list plus `restriction`/`credits`, which it ignores, so they show their options but usually require 0. " +
      "`numberOf` has no course list of its own, so on `v2/main` it shows as an empty rule.",
  );
  if (failed.length) {
    p();
    p("### Not fetched");
    p();
    for (const f of failed) p(`- ${f}`);
  }

  p();
  p("## Per program");
  p();
  p("Only programs with at least one finding. Columns: unhandled conditions · `freeformText` · prose-only credits · empty course rules · old ids · unresolved ids.");
  p();
  p("| Program | Rules | Unhandled | Freeform | Prose credits | Empty | Old ids | Unresolved |");
  p("|---|---|---|---|---|---|---|---|");
  const flagged = results
    .filter((r) => r.unhandled.length + r.freeform.length + r.proseOnlyCredits.length + r.emptyCourseRules.length + r.ids.old + r.ids.unresolved > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
  for (const r of flagged) {
    p(
      `| ${cell(r.name)} (\`${r.id}\`) | ${r.rules} | ${r.unhandled.length || ""} | ${r.freeform.length || ""} | ${r.proseOnlyCredits.length || ""} | ` +
        `${r.emptyCourseRules.length || ""} | ${r.ids.old || ""} | ${r.ids.unresolved || ""} |`,
    );
  }

  p();
  p("## Details");
  p();
  p("Rule-level findings, grouped by program. Text is clipped catalog prose.");
  for (const r of flagged) {
    const rows = [
      ...r.unhandled.map((f) => ["unhandled", f] as const),
      ...r.freeform.map((f) => ["freeform", f] as const),
      ...r.proseOnlyCredits.map((f) => ["prose credits", f] as const),
      ...r.emptyCourseRules.map((f) => ["empty", f] as const),
    ];
    if (!rows.length && !r.unresolvedIds.length) continue;
    p();
    p(`### ${r.name}`);
    p();
    if (rows.length) {
      p("| Finding | Requirement | Rule | Detail |");
      p("|---|---|---|---|");
      for (const [kind, f] of rows) p(`| ${kind} | ${cell(f.requirement)} | ${cell(f.rule)} | ${cell(f.detail)} |`);
    }
    if (r.unresolvedIds.length) {
      p();
      p(`Unresolved ids: ${r.unresolvedIds.map((id) => `\`${id}\``).join(", ")}`);
    }
  }
  p();
  return lines.join("\n");
}

await main();
