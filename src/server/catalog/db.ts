import "server-only";
import { DERIVED_SQL } from "./d1Schema.ts";

/**
 * Read-only course catalog (GopherGrades-derived; see docs/agent/architecture.md and
 * docs/agent/cloudflare.md). Written by Hadi's Claude.
 *
 * On Cloudflare Workers the catalog lives in the D1 database bound as `CATALOG_DB`. Everywhere else
 * (Vitest, `next dev`/`next start`) it is `data/catalog.db`, opened with `node:sqlite`. Both expose
 * the same async `all()`, so every query here must run on both: no more than 100 bound parameters
 * (D1's limit; pass lists as one JSON string through `json_each(?)`), and only the tables in
 * `CATALOG_TABLES` plus the derived ones in `DERIVED_SQL`.
 */

export type SqlValue = string | number | null;

export interface CatalogDb {
  all<T>(sql: string, ...params: SqlValue[]): Promise<T[]>;
}

/** Only Twin Cities courses are in scope for v2. */
export const CAMPUS = "UMNTC";

export { CATALOG_TABLES, DERIVED_SQL } from "./d1Schema.ts";

/** `IN` list as a single bound parameter: `id IN (SELECT value FROM json_each(?))`. */
export const jsonList = (values: readonly (string | number)[]) => JSON.stringify(values);

/** Comma-joined `course_terms.terms` → ["1229", "1233", …]. */
export const splitTerms = (terms: string | null | undefined) => (terms ? terms.split(",") : []);

let opened: Promise<CatalogDb> | null = null;

export function catalog(): Promise<CatalogDb> {
  opened ??= open().catch((err) => {
    opened = null;
    throw err;
  });
  return opened;
}

// Module names kept out of static imports, so neither bundler tries to resolve the other runtime's module.
const WORKERS_MODULE = "cloudflare:workers";
const SQLITE_MODULE = "node:sqlite";

interface D1Like {
  prepare(sql: string): { bind(...values: unknown[]): { all<T>(): Promise<{ results: T[] }> } };
}

async function open(): Promise<CatalogDb> {
  const d1 = await workersBinding();
  if (d1) return { all: async (sql, ...params) => (await d1.prepare(sql).bind(...params).all()).results as never };
  return openSqliteFile();
}

async function workersBinding(): Promise<D1Like | null> {
  if (typeof navigator === "undefined" || navigator.userAgent !== "Cloudflare-Workers") return null;
  const { env } = (await import(/* @vite-ignore */ /* webpackIgnore: true */ WORKERS_MODULE)) as { env: { CATALOG_DB?: D1Like } };
  if (!env.CATALOG_DB) throw new Error("The CATALOG_DB D1 binding is missing (see docs/agent/cloudflare.md).");
  return env.CATALOG_DB;
}

async function openSqliteFile(): Promise<CatalogDb> {
  const { DatabaseSync } = (await import(/* webpackIgnore: true */ SQLITE_MODULE)) as typeof import("node:sqlite");
  const file = `${process.cwd()}/data/catalog.db`;
  // An in-memory main database with the catalog attached read-only, so DERIVED_SQL's course_terms
  // can be built without writing to data/catalog.db. (Indexes only matter for D1's read cost.)
  const db = new DatabaseSync(":memory:");
  db.prepare("ATTACH DATABASE ? AS cat").run(`file:${file}?mode=ro`);
  // Unqualified names resolve to main first, then the attached catalog.
  db.exec(DERIVED_SQL[0]);
  db.exec(DERIVED_SQL[1]);
  return { all: async (sql, ...params) => db.prepare(sql).all(...params) as never };
}
