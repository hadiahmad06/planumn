/**
 * Phase C/C4 (Hadi's Claude): compare planu.mn's requirement results with a saved APAS report, locally.
 *
 *   npm run dev                                                     # in another terminal
 *   node scripts/apas-compare.ts <report.html> <programId> [--base http://localhost:3000]
 *
 * For a student's own saved report ("Save a copy (.html)" on /plan/apas). The report is read from disk
 * and parsed in this process. Nothing is written anywhere; the comparison is only printed. The only data
 * that leaves this process is the list of course codes and catalog ids, sent to the local dev server to
 * look up the program and the courses (the same lookups /plan/apas makes). Never commit a real report.
 */
import { readFileSync } from "node:fs";
import { Window } from "happy-dom";
import { compareApasProgram, apasRecordCodes, describeApasStatus, type ApasPair } from "../src/domain/apasCompare.ts";
import type { PlannedForAudit, Program } from "../src/domain/requirements.ts";
import { parseApasReport } from "../src/features/apas/parseReport.ts";

const USAGE = "Usage: node scripts/apas-compare.ts <report.html> <programId> [--base http://localhost:3000]";

/** A short message and exit 1, never a stack trace (review fix, #89). Never prints report content. */
function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const args = process.argv.slice(2);
const baseAt = args.indexOf("--base");
let base = "http://localhost:3000";
if (baseAt >= 0) {
  const value = args.splice(baseAt, 2)[1];
  if (!value || value.startsWith("--")) fail(`--base needs a URL, e.g. --base http://localhost:3220\n${USAGE}`);
  if (!URL.canParse(value)) fail(`--base "${value}" isn't a URL.\n${USAGE}`);
  base = value.replace(/\/$/, "");
}
const [reportPath, programId] = args;
if (!reportPath) fail(USAGE);

let html = "";
try {
  html = readFileSync(reportPath, "utf8");
} catch (e) {
  fail(`Couldn't read ${reportPath} (${(e as NodeJS.ErrnoException).code ?? "unreadable"}).`);
}
const window = new Window();
const doc = new window.DOMParser().parseFromString(html, "text/html");
const audit = parseApasReport(doc as unknown as Document);
await window.happyDOM.close();
if (!audit) fail("That file isn't an APAS audit report (no #audit element).");
if (!programId) fail(`The audit is for APAS program ${audit.program.code} ("${audit.program.title}"). Pass the CourseDog program id too.\n${USAGE}`);

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, init);
  } catch {
    fail(`Couldn't reach ${base}. Is the dev server (npm run dev) running there?`);
  }
  if (!res.ok) fail(`${base}${path.split("?")[0]} answered HTTP ${res.status}.${res.status === 502 ? " CourseDog may be unreachable." : ""}`);
  try {
    return (await res.json()) as T;
  } catch {
    fail(`${base}${path.split("?")[0]} didn't answer with JSON. Is --base a planu.mn dev server?`);
  }
}

const program = await json<Program>(`/api/programs/${encodeURIComponent(programId)}`);
const codes = [...apasRecordCodes(audit)];
const { ids } = await json<{ ids: Record<string, number> }>("/api/courses/by-code", {
  method: "POST",
  // The route accepts same-origin requests only, so say we're the dev server's own page.
  headers: { "Content-Type": "application/json", Origin: base },
  body: JSON.stringify({ codes }),
});
const found = Object.values(ids);
const details: { id: number; credits: { min: number } }[] = [];
for (let i = 0; i < found.length; i += 200) details.push(...(await json<typeof details>(`/api/courses?ids=${found.slice(i, i + 200).join(",")}`)));
const credits = new Map(details.map((d) => [d.id, d.credits.min]));
// The same planned-course list the rail builds: each course once, at its catalog minimum credits.
const planned: PlannedForAudit[] = Object.entries(ids).map(([code, courseId]) => ({ courseId, credits: credits.get(courseId) ?? 0, code }));

const c = compareApasProgram(audit, program, planned);
const side = (p: ApasPair) =>
  `${p.target.name} [${p.target.level}, ${p.match} name]: ${p.target.units === 0 ? "nothing counted" : `${p.target.satisfied ? "met" : "not met"} ${p.target.filled}/${p.target.units}`}`;

console.log(`APAS: ${audit.program.title} (${audit.program.code}), prepared ${audit.preparedOn ?? "?"}`);
console.log(`planu.mn: ${program.name} (${program.id})`);
console.log(`Courses on the audit's record: ${codes.length}, in planu.mn's catalog: ${found.length}`);
const missing = codes.filter((code) => !(code in ids));
if (missing.length) console.log(`  not in the catalog (can't count): ${missing.join(", ")}`);
console.log(`\n${c.pairs.length} pairs, ${c.disagreements} disagreements\n`);
for (const p of c.pairs) console.log(`${p.verdict.toUpperCase().padEnd(9)} APAS "${p.apas.title}": ${describeApasStatus(p.apas)}\n          ↔ ${side(p)}`);
console.log(`\nOnly in APAS (${c.apasOnly.length}):`);
for (const r of c.apasOnly)
  console.log(`  "${r.title}" (${r.id}): ${describeApasStatus(r)}${c.ambiguous.includes(r) ? " [left unpaired: several equally close planu.mn names]" : ""}`);
console.log(`\nNo APAS match (${c.planumnOnly.length}):`);
for (const r of c.planumnOnly) console.log(`  ${r.name}`);
console.log(`\nIgnored, no status in APAS (${c.ignored.length}): ${c.ignored.map((r) => r.title).join("; ")}`);
