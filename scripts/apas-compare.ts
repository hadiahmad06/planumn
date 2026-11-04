/**
 * Phase C/C4 (Hadi's Claude): compare planu.mn's requirement results with saved APAS reports, locally.
 *
 *   node scripts/requirement-coverage.ts                            # once: fills .cache/coursedog/
 *   node scripts/apas-compare.ts                                    # every ~/Downloads/apas-report-*.html
 *   node scripts/apas-compare.ts <report.html>… [--program <id>]
 *
 * For a student's own saved reports ("Save a copy (.html)" on /plan/apas). Runs offline: each report is
 * parsed in this process, its CourseDog program is found from the APAS program code (the same rule
 * /plan/apas uses; `--program` overrides it), the program comes from the CourseDog cache that
 * requirement-coverage.ts writes, and courses come from data/catalog.db. Nothing is sent anywhere and
 * nothing is written; the comparison is only printed. Never commit a real report.
 *
 * Each report is compared with the program's C2/C3 catalog-text readings counted, then shown only. A
 * program is **eligible** to count them (src/domain/catalogTextCounting.ts) when the counted comparison
 * has no disagreement and every requirement holding a counted reading pairs with an APAS requirement
 * that agrees, so each reading was actually checked against APAS.
 *
 * The program is built the way src/server/programs/getProgram.ts builds it, minus the live CourseDog
 * lookup of courses missing from the catalog: those can't be planned, so they never change a result.
 */
import { existsSync, globSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { Window } from "happy-dom";
import type { ApasAudit } from "../src/domain/apas.ts";
import { compareApasProgram, apasRecordCodes, describeApasStatus, type ApasPair } from "../src/domain/apasCompare.ts";
import { apasProgramId } from "../src/domain/apasPlan.ts";
import type { PlannedForAudit, Program, Rule } from "../src/domain/requirements.ts";
import { parseApasReport } from "../src/features/apas/parseReport.ts";
import programOptions from "../src/features/requirements/programOptions.json" with { type: "json" };
import { collectGroupIds, normalizeProgram, pickCurrentVersion, type RawProgram, type ResolveOption } from "../src/server/programs/normalize.ts";

const USAGE = "Usage: node scripts/apas-compare.ts [<report.html>…] [--program <CourseDog program id>]";
const CACHE = path.join(process.cwd(), ".cache", "coursedog");

/** A short message and exit 1, never a stack trace (review fix, #89). Never prints report content. */
function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const args = process.argv.slice(2);
const programAt = args.indexOf("--program");
let programOverride: string | null = null;
if (programAt >= 0) {
  programOverride = args.splice(programAt, 2)[1] ?? null;
  if (!programOverride || programOverride.startsWith("--")) fail(`--program needs a CourseDog program id, e.g. --program 019627107\n${USAGE}`);
}
const unknown = args.find((a) => a.startsWith("--"));
if (unknown) fail(`Unknown option ${unknown}.\n${USAGE}`);
const reports = args.length ? args : globSync(path.join(homedir(), "Downloads", "apas-report-*.html")).sort();
if (!reports.length) fail(`No reports given, and none found at ~/Downloads/apas-report-*.html.\n${USAGE}`);
if (programOverride && reports.length > 1) fail("--program applies to one report at a time.");
if (!existsSync(path.join(CACHE, "programs"))) fail("No CourseDog cache at .cache/coursedog/. Run node scripts/requirement-coverage.ts first.");

const db = new DatabaseSync(path.join(process.cwd(), "data", "catalog.db"), { readOnly: true });
const ph = (n: number) => Array.from({ length: n }, () => "?").join(",");
interface Row {
  id: number;
  dept_abbr: string;
  course_num: string;
  class_desc: string;
  cred_min: number | null;
  cred_max: number | null;
  courseGroupId: string;
}
/** Same rows and credits as src/server/catalog/courses.ts (`findCoursesByGroupIds`, `toSummary`). */
function coursesByGroupId(groupIds: string[]): Map<string, Row> {
  const out = new Map<string, Row>();
  const unique = [...new Set(groupIds)];
  for (let i = 0; i < unique.length; i += 500) {
    const chunk = unique.slice(i, i + 500);
    const rows = db
      .prepare(
        `SELECT id, dept_abbr, course_num, class_desc, cred_min, cred_max, courseGroupId FROM classdistribution
         WHERE campus = 'UMNTC' AND courseGroupId IN (${ph(chunk.length)}) ORDER BY id`,
      )
      .all(...chunk) as unknown as Row[];
    for (const r of rows) if (!out.has(r.courseGroupId)) out.set(r.courseGroupId, r);
  }
  return out;
}
const minCredits = (r: { cred_min: number | null; cred_max: number | null }) => r.cred_min ?? r.cred_max ?? 0;

/** Old 20-character CourseDog ids → current group ids, from the course searches requirement-coverage.ts cached (C1c). */
const renamedIds = new Map<string, string>();
for (const file of globSync(path.join(CACHE, "courses", "*.json"))) {
  const body = JSON.parse(readFileSync(file, "utf8")) as { data?: { courseGroupId: string; deprecatedCourseGroupId?: string | null }[] };
  for (const c of body.data ?? []) if (c.deprecatedCourseGroupId) renamedIds.set(c.deprecatedCourseGroupId, c.courseGroupId);
}
const subjects = new Set((db.prepare("SELECT dept_abbr AS code FROM departmentdistribution WHERE campus = 'UMNTC'").all() as { code: string }[]).map((d) => d.code));

function loadProgram(id: string): Program | null {
  const file = path.join(CACHE, "programs", `${id}.json`);
  if (!existsSync(file)) return null;
  const raw = pickCurrentVersion(JSON.parse(readFileSync(file, "utf8")) as Record<string, RawProgram>);
  if (!raw) return null;
  const groupIds = collectGroupIds(raw);
  const inCatalog = coursesByGroupId([...groupIds, ...groupIds.flatMap((g) => renamedIds.get(g) ?? [])]);
  const resolve: ResolveOption = (groupId) => {
    const c = inCatalog.get(groupId) ?? inCatalog.get(renamedIds.get(groupId) ?? "");
    if (!c) return { groupId, courseId: null, code: null, title: null, credits: null };
    return { groupId, courseId: c.id, code: `${c.dept_abbr} ${c.course_num}`, title: c.class_desc, credits: { min: minCredits(c), max: c.cred_max ?? minCredits(c) } };
  };
  return normalizeProgram(raw, resolve, undefined, subjects);
}

/** The same planned-course list the rail builds: each course on the record once, at its catalog minimum credits. */
function plannedFor(audit: ApasAudit) {
  const codes = [...apasRecordCodes(audit)];
  const stmt = db.prepare("SELECT id, cred_min, cred_max FROM classdistribution WHERE campus = 'UMNTC' AND dept_abbr = ? AND course_num = ? LIMIT 1");
  const planned: PlannedForAudit[] = [];
  const missing: string[] = [];
  for (const code of codes) {
    const [dept, number] = code.toUpperCase().split(" ");
    const row = number ? (stmt.get(dept, number) as { id: number; cred_min: number | null; cred_max: number | null } | undefined) : undefined;
    if (row) planned.push({ courseId: row.id, credits: minCredits(row), code: code.toUpperCase() });
    else missing.push(code);
  }
  return { codes, planned, missing };
}

/** A reading that counting changes: a total, min or dept constraint, or a course pattern (a max only caps). */
const counts = (x: { constraints?: { kind: string }[] }) => x.constraints?.some((k) => k.kind !== "max") ?? false;
const ruleHolds = (r: Rule): boolean => counts(r) || !!r.pattern || ("children" in r && r.children.some(ruleHolds));
const holdsReading = (r: Program["requirements"][number]) => counts(r) || r.rules.some(ruleHolds);

const side = (p: ApasPair) =>
  `${p.target.name} [${p.target.level}, ${p.match} name]: ${p.target.units === 0 ? "nothing counted" : `${p.target.satisfied ? "met" : "not met"} ${p.target.filled}/${p.target.units}`}`;
const programIds = programOptions.map((o) => o.id);
const summary: string[] = [];

for (const reportPath of reports) {
  const name = path.basename(reportPath);
  let html = "";
  try {
    html = readFileSync(reportPath, "utf8");
  } catch (e) {
    summary.push(`${name}: couldn't read it (${(e as NodeJS.ErrnoException).code ?? "unreadable"})`);
    continue;
  }
  const window = new Window();
  const audit = parseApasReport(new window.DOMParser().parseFromString(html, "text/html") as unknown as Document);
  await window.happyDOM.close();
  if (!audit) {
    summary.push(`${name}: not an APAS audit report (no #audit element), skipped`);
    continue;
  }
  const programId = programOverride ?? apasProgramId(audit.program.code, programIds);
  if (!programId) {
    summary.push(`${name}: no CourseDog program matches APAS ${audit.program.code} ("${audit.program.title}"); pass --program`);
    continue;
  }
  const program = loadProgram(programId);
  if (!program) {
    summary.push(`${name}: program ${programId} isn't in .cache/coursedog/programs; run node scripts/requirement-coverage.ts`);
    continue;
  }
  const { codes, planned, missing } = plannedFor(audit);
  const c = compareApasProgram(audit, program, planned, { catalogText: "count" });
  const shown = compareApasProgram(audit, program, planned, { catalogText: "show" });
  const verdictShown = new Map(shown.pairs.map((p) => [`${p.apas.id}|${p.target.id}`, p.verdict]));
  const agreeing = new Set(c.pairs.filter((p) => p.verdict === "agree").map((p) => p.target.requirementId));
  const withReadings = program.requirements.filter((r) => r.rules.length > 0 && holdsReading(r));
  const unchecked = withReadings.filter((r) => !agreeing.has(r.id));
  const eligible = withReadings.length > 0 && c.disagreements === 0 && unchecked.length === 0;

  console.log(`\n=== ${name} ===`);
  console.log(`APAS: ${audit.program.title} (${audit.program.code}), prepared ${audit.preparedOn ?? "?"}`);
  console.log(`planu.mn: ${program.name} (${program.id})`);
  console.log(`Courses on the audit's record: ${codes.length}, in planu.mn's catalog: ${planned.length}`);
  if (missing.length) console.log(`  not in the catalog (can't count): ${missing.join(", ")}`);
  console.log(`\n${c.pairs.length} pairs, ${c.disagreements} disagreements with catalog-text readings counted (${shown.disagreements} shown only)\n`);
  for (const p of c.pairs) {
    const before = verdictShown.get(`${p.apas.id}|${p.target.id}`);
    const changed = before && before !== p.verdict ? ` (shown only: ${before})` : "";
    console.log(`${p.verdict.toUpperCase().padEnd(9)} APAS "${p.apas.title}": ${describeApasStatus(p.apas)}\n          ↔ ${side(p)}${changed}`);
  }
  console.log(`\nRequirements holding catalog-text readings (${withReadings.length}):`);
  for (const r of withReadings) console.log(`  ${agreeing.has(r.id) ? "checked  " : "unchecked"} ${r.name}`);
  console.log(`\nOnly in APAS (${c.apasOnly.length}):`);
  for (const r of c.apasOnly)
    console.log(`  "${r.title}" (${r.id}): ${describeApasStatus(r)}${c.ambiguous.includes(r) ? " [left unpaired: several equally close planu.mn names]" : ""}`);
  console.log(`\nNo APAS match (${c.planumnOnly.length}):`);
  for (const r of c.planumnOnly) console.log(`  ${r.name}`);
  console.log(`\nIgnored, no status in APAS (${c.ignored.length}): ${c.ignored.map((r) => r.title).join("; ")}`);

  const count = (v: string) => c.pairs.filter((p) => p.verdict === v).length;
  summary.push(
    `${name}: ${program.name} (${program.id}): ${count("agree")} agree, ${c.disagreements} disagree, ${count("unchecked")} unchecked, ` +
      `${c.apasOnly.length} only in APAS (${c.ambiguous.length} ambiguous), ${c.planumnOnly.length} with no APAS match; ` +
      (eligible
        ? "ELIGIBLE to count catalog text"
        : `not eligible to count catalog text (${!withReadings.length ? "no readings" : [c.disagreements ? `${c.disagreements} disagreements` : "", unchecked.length ? `${unchecked.length} of ${withReadings.length} requirements with readings unchecked` : ""].filter(Boolean).join(", ")})`),
  );
}

console.log(`\n=== Summary (${reports.length} file${reports.length === 1 ? "" : "s"}) ===`);
for (const line of summary) console.log(line);
