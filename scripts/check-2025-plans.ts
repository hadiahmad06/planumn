/**
 * A1 (Hadi's Claude, #99): read-only check of an export of the Supabase `plans` table.
 *
 *   node scripts/check-2025-plans.ts <plans-export.json> [--json] [--all] [--no-catalog]
 *
 * Reports every row that v2 can't save (or open), would lose data on load → save, or rewrites on
 * its first save, plus warnings (course ids missing from data/catalog.db, other-campus ids, …).
 * It reads the export file and data/catalog.db (read-only) and nothing else: it never connects to
 * Supabase and never writes a file. Rows are named by id only, never by title or owner.
 * Exit code: 0 = every row loads and saves without loss, 1 = some row fails or loses data, 2 = bad input.
 *
 * Making the export (Hadi): in the Supabase SQL editor run
 *   select coalesce(json_agg(p), '[]'::json) from plans p;
 * and save the cell's value to a file outside the repo, or use psql:
 *   psql "$DATABASE_URL" -At -c "select coalesce(json_agg(p), '[]'::json) from plans p" > ~/plans-export.json
 * Don't commit the export.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { checkExport, readExport, type CampusOf, type RowReport } from "../src/features/plans/check2025.ts";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
if (!file || args.includes("--help")) {
  console.error("Usage: node scripts/check-2025-plans.ts <plans-export.json> [--json] [--all] [--no-catalog]");
  process.exit(2);
}

let rows: unknown[];
try {
  rows = readExport(readFileSync(file, "utf8"));
} catch (error) {
  console.error(`Could not read ${file}: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(2);
}

let campusOf: CampusOf | undefined;
const catalogPath = path.join(process.cwd(), "data", "catalog.db");
if (!args.includes("--no-catalog") && existsSync(catalogPath)) {
  const db = new DatabaseSync(catalogPath, { readOnly: true });
  const campuses = new Map<number, string>();
  for (const r of db.prepare("SELECT id, campus FROM classdistribution").all() as unknown as { id: number; campus: string }[]) campuses.set(r.id, r.campus);
  db.close();
  campusOf = (id) => campuses.get(id) ?? null;
} else if (!args.includes("--no-catalog")) {
  console.error("data/catalog.db not found (run from the repo root); course id checks skipped.");
}

const report = checkExport(rows, campusOf);

if (args.includes("--json")) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const { counts } = report;
  console.log(`${report.total} plan rows checked${campusOf ? " (course ids against data/catalog.db)" : ""}`);
  console.log(`  ok: ${counts.ok} · warnings: ${counts.warnings} · changed on first save: ${counts.changes} · LOSES DATA: ${counts["loses-data"]} · FAILS: ${counts.fails}`);
  if (report.duplicateIds.length) console.log(`  repeated row ids in the export: ${report.duplicateIds.join(", ")}`);
  const shown = args.includes("--all") ? report.rows : report.rows.filter((r) => r.status !== "ok");
  for (const r of shown) printRow(r);
}
process.exit(report.counts.fails || report.counts["loses-data"] ? 1 : 0);

function printRow(r: RowReport) {
  console.log(`\n${r.id}: ${r.status.toUpperCase()}`);
  for (const [label, list] of [
    ["fails", r.fails],
    ["loses data", r.losesData],
    ["changes", r.changes],
    ["warning", r.warnings],
    ["note", r.notes],
  ] as const)
    for (const line of list) console.log(`  ${label}: ${line}`);
}
