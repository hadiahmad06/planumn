import "server-only";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

/**
 * Read-only course catalog (GopherGrades-derived, built in 2025; see docs/agent/architecture.md).
 * Tables used: classdistribution, distribution, termdistribution, libed, libedAssociationTable.
 */
let db: DatabaseSync | null = null;

export const CATALOG_PATH = path.join(process.cwd(), "data", "catalog.db");

/** Only Twin Cities courses are in scope for v2. */
export const CAMPUS = "UMNTC";

export function catalog(): DatabaseSync {
  db ??= new DatabaseSync(CATALOG_PATH, { readOnly: true });
  return db;
}
