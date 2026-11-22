/**
 * Hadi's Claude: write `data/catalog.db` as a SQL file for the D1 database `planumn-catalog`
 * (docs/agent/cloudflare.md).
 *
 *   node scripts/export-d1.ts [--out .wrangler/catalog-d1.sql]
 *
 * Copies only the tables the app reads (`CATALOG_TABLES`), then the derived `course_terms` table and the
 * indexes (`DERIVED_SQL`). The file drops and recreates those tables, so loading it again replaces the
 * catalog. Load it with:
 *
 *   npx wrangler d1 execute planumn-catalog --local  --file .wrangler/catalog-d1.sql   # local dev
 *   npx wrangler d1 execute planumn-catalog --remote --file .wrangler/catalog-d1.sql   # production
 *
 * Writes nothing to `data/`. The output is gitignored (it is generated from data/catalog.db).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { CATALOG_TABLES, DERIVED_SQL } from "../src/server/catalog/d1Schema.ts";

const args = process.argv.slice(2);
const outIdx = args.indexOf("--out");
const out = outIdx >= 0 ? args[outIdx + 1] : ".wrangler/catalog-d1.sql";

// Parents before children. Foreign keys are dropped anyway (below), so this is only tidiness.
const INSERT_ORDER = [
  "libed",
  "professor",
  "departmentdistribution",
  "classdistribution",
  "libedAssociationTable",
  "distribution",
  "termdistribution",
] as const;
if (INSERT_ORDER.length !== CATALOG_TABLES.length || !CATALOG_TABLES.every((t) => (INSERT_ORDER as readonly string[]).includes(t)))
  throw new Error("INSERT_ORDER must list exactly CATALOG_TABLES");

// Build the derived data in a scratch copy, never in data/catalog.db.
const db = new DatabaseSync(":memory:");
db.prepare("ATTACH DATABASE ? AS src").run("file:data/catalog.db?mode=ro");
const schema = new Map(
  (db.prepare("SELECT name, sql FROM src.sqlite_master WHERE type = 'table'").all() as { name: string; sql: string }[]).map((r) => [r.name, r.sql]),
);
for (const t of INSERT_ORDER) {
  const sql = schema.get(t);
  if (!sql) throw new Error(`data/catalog.db has no table ${t}`);
  db.exec(withoutForeignKeys(sql));
  db.exec(`INSERT INTO main."${t}" SELECT * FROM src."${t}"`);
}
db.exec("DETACH DATABASE src");
for (const sql of DERIVED_SQL) db.exec(sql);

/**
 * The catalog is read-only and two GopherGrades rows name a department missing from
 * departmentdistribution, which D1 (foreign keys always on) would reject. Drop the constraints.
 */
function withoutForeignKeys(sql: string): string {
  return sql.replace(/,\s*FOREIGN KEY\s*\([^)]*\)\s*REFERENCES\s*"?\w+"?\s*\([^)]*\)(\s*ON (DELETE|UPDATE) \w+( \w+)?)*/gi, "");
}

function literal(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number" || typeof v === "bigint") return String(v);
  if (v instanceof Uint8Array) return `X'${Buffer.from(v).toString("hex")}'`;
  return `'${String(v).replaceAll("'", "''")}'`;
}

const lines: string[] = [];
const tables = [...INSERT_ORDER, "course_terms"];
for (const t of [...tables].reverse()) lines.push(`DROP TABLE IF EXISTS "${t}";`);
const counts: Record<string, number> = {};
for (const t of tables) {
  const { sql } = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?").get(t) as { sql: string };
  lines.push(`${sql};`);
  const rows = db.prepare(`SELECT * FROM "${t}"`).all() as Record<string, unknown>[];
  counts[t] = rows.length;
  if (rows.length === 0) continue;
  const cols = Object.keys(rows[0]).map((c) => `"${c}"`).join(", ");
  for (const r of rows) lines.push(`INSERT INTO "${t}" (${cols}) VALUES (${Object.values(r).map(literal).join(", ")});`);
}
for (const { sql } of db.prepare("SELECT sql FROM sqlite_master WHERE type = 'index' AND sql IS NOT NULL").all() as { sql: string }[])
  lines.push(`${sql};`);

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${lines.join("\n")}\n`);
console.log(`Wrote ${out}`);
for (const [t, n] of Object.entries(counts)) console.log(`  ${t}: ${n} rows`);
