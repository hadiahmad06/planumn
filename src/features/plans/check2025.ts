/**
 * A1 (Hadi's Claude, #99): checks stored `plans` rows (2025 or later) against v2's load and save path,
 * without any I/O. `scripts/check-2025-plans.ts` runs it on a JSON export; the tests run it on the
 * fixtures in `__fixtures__/plans2025.ts`. Relative `.ts` imports so plain Node can run it.
 *
 * Per row:
 *   - fails      v2 can't save it (and may not open it): `planProblems` after `normalizePlan`
 *   - losesData  loading then saving would drop something the row holds (should never happen)
 *   - changes    lossless rewrites the first save makes (filled locks, sorted terms, …)
 *   - warnings   loads and saves, but something shows differently (unknown course ids, …)
 *   - notes      informational (extra fields kept, recycle bin)
 */
import { normalizeSemesters, type Plan, type Semester } from "../../domain/plan.ts";
import { normalizePlan, planProblems } from "./validation.ts";

export type Status = "fails" | "loses-data" | "changes" | "warnings" | "ok";

export interface RowReport {
  /** The row's id (never its title or owner, so reports can be pasted safely). */
  id: string;
  status: Status;
  fails: string[];
  losesData: string[];
  changes: string[];
  warnings: string[];
  notes: string[];
}

/** Campus of a catalog course id ("UMNTC", "UMNMO", …), or null when the id isn't in the catalog. */
export type CampusOf = (id: number) => string | null;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const COURSE_KEYS = new Set(["id", "lock"]);
const SEMESTER_KEYS = new Set(["index", "courses", "placeholders"]);
const ROW_COLUMNS = new Set(["id", "user_id", "title", "programs", "semesters", "can_view", "created_at", "last_updated", "deletion_scheduled_at"]);

/** JSON with sorted object keys, so equal data compares equal whatever its key order. */
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (isObject(value))
    return `{${Object.keys(value)
      .sort()
      .filter((k) => value[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`)
      .join(",")}}`;
  return JSON.stringify(value) ?? "null";
}

/**
 * Rows from an export file: a JSON array of rows, `{ rows | data: [...] }`, the one-cell result of
 * `select json_agg(p) from plans p` (`[{ "json_agg": [...] }]`), or one JSON row per line.
 */
export function readExport(text: string): unknown[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as unknown);
  }
  for (let i = 0; i < 3; i++) {
    if (typeof parsed === "string") parsed = JSON.parse(parsed);
    else if (isObject(parsed) && Array.isArray(parsed.rows ?? parsed.data)) parsed = parsed.rows ?? parsed.data;
    else if (Array.isArray(parsed) && parsed.length === 1 && isObject(parsed[0]) && Object.keys(parsed[0]).length === 1) {
      const only = Object.values(parsed[0])[0];
      if (Array.isArray(only) || typeof only === "string") parsed = only;
      else break;
    } else break;
  }
  if (!Array.isArray(parsed)) throw new Error("The export is not a list of plans rows.");
  return parsed;
}

/** Check one stored row. `campusOf` (from data/catalog.db) enables the course id checks. */
export function checkPlanRow(raw: unknown, campusOf?: CampusOf): RowReport {
  const report: RowReport = { id: "(no id)", status: "ok", fails: [], losesData: [], changes: [], warnings: [], notes: [] };
  const finish = () => {
    report.status = report.fails.length
      ? "fails"
      : report.losesData.length
        ? "loses-data"
        : report.changes.length
          ? "changes"
          : report.warnings.length
            ? "warnings"
            : "ok";
    return report;
  };
  if (!isObject(raw)) {
    report.fails.push("row is not an object");
    return finish();
  }
  report.id = typeof raw.id === "string" ? raw.id : JSON.stringify(raw.id) ?? "(no id)";

  // Some export tools write json/array columns as strings; that's the export, not the row.
  const row: Record<string, unknown> = { ...raw };
  for (const key of ["semesters", "programs", "can_view"]) {
    if (typeof row[key] !== "string") continue;
    try {
      row[key] = JSON.parse(row[key] as string);
      report.notes.push(`${key} was a JSON string in the export (read as JSON)`);
    } catch {
      report.fails.push(`${key} is a string that isn't JSON: export with \`select json_agg(p) from plans p\``);
    }
  }

  // Load: exactly what SupabasePlanRepository.get / list do.
  const loaded = normalizePlan(row as unknown as Plan);
  if (row.title == null) report.changes.push("title is null: shown as \"Untitled plan\", saved as \"\"");
  if (row.programs == null) report.changes.push("programs is null: saved as []");
  if (row.can_view == null) report.changes.push("can_view is null: read as [] (saving never writes it)");
  if (row.last_updated == null) report.changes.push("last_updated is null: shown as created_at until the next save");
  const lockFixes = countLockFixes(row.semesters);
  if (lockFixes) report.changes.push(`${lockFixes} course${lockFixes === 1 ? " has" : "s have"} a missing or unknown lock: loaded and saved as "unlocked" (2025 did the same)`);

  report.fails.push(...planProblems(loaded));
  const extraColumns = Object.keys(row).filter((k) => !ROW_COLUMNS.has(k));
  if (extraColumns.length) report.notes.push(`columns v2 doesn't read (left untouched by saves): ${extraColumns.join(", ")}`);
  if (Array.isArray(row.major) && row.major.length && !(Array.isArray(row.programs) && row.programs.length))
    report.warnings.push("`major` has values but `programs` is empty: v2 (like 2025 main) shows no programs");
  if (loaded.deletion_scheduled_at) report.notes.push("in the recycle bin: listed under My Plans' bin, opens after Recover");
  if (!Array.isArray(loaded.semesters) || !loaded.semesters.every((s) => isObject(s) && Array.isArray(s.courses))) return finish();

  // Open: what the editor store does (usePlanStore.loadPlan), then what a save writes back.
  const semesters = loaded.semesters as Semester[];
  const stored = normalizeSemesters(semesters);
  const order = semesters.map((s) => s.index);
  if (stored.length < semesters.length) report.changes.push(`${semesters.length - stored.length} repeated term code(s): merged into one semester each on the first save`);
  else if (order.join() !== stored.map((s) => s.index).join()) report.changes.push("semesters are out of term order: shown and saved sorted");
  report.losesData.push(...roundTripLosses(semesters, stored));
  if (canonical(loaded.title) !== canonical(row.title ?? "")) report.losesData.push("title changes on load");
  if (canonical(loaded.programs) !== canonical(row.programs ?? [])) report.losesData.push("programs change on load");

  // Courses: shown right, by id.
  const extras = new Set<string>();
  const repeated: string[] = [];
  for (const s of stored) {
    const seen = new Set<number>();
    for (const c of s.courses) {
      for (const k of Object.keys(c)) if (!COURSE_KEYS.has(k)) extras.add(k);
      if (seen.has(c.id)) repeated.push(`${c.id} in ${s.index}`);
      seen.add(c.id);
    }
  }
  if (extras.size) report.notes.push(`courses carry 2025 fields v2 keeps but doesn't read: ${[...extras].sort().join(", ")}`);
  if (repeated.length)
    report.warnings.push(`same course twice in one term (${repeated.join("; ")}): both are kept and shown, but dragging either card may misbehave`);
  if (campusOf) {
    const ids = [...new Set(stored.flatMap((s) => s.courses.map((c) => c.id)).filter((id) => typeof id === "number"))];
    const missing = ids.filter((id) => campusOf(id) === null);
    const other = ids.filter((id) => {
      const campus = campusOf(id);
      return campus !== null && campus !== "UMNTC";
    });
    if (missing.length) report.warnings.push(`course ids not in data/catalog.db (cards show "…"): ${missing.join(", ")}`);
    if (other.length)
      report.warnings.push(`other-campus course ids (2025 search had no campus filter; shown, but requirements only list Twin Cities ids): ${other.join(", ")}`);
  }
  return finish();
}

function countLockFixes(semesters: unknown): number {
  if (!Array.isArray(semesters)) return 0;
  let n = 0;
  for (const s of semesters)
    if (isObject(s) && Array.isArray(s.courses))
      for (const c of s.courses) if (isObject(c) && !["locked", "unlocked", "autofilled"].includes(c.lock as string)) n++;
  return n;
}

/** Everything a row's semesters hold must still be there after load + save (order aside). */
function roundTripLosses(before: Semester[], after: Semester[]): string[] {
  const losses: string[] = [];
  const entries = (list: Semester[]) => {
    const counts = new Map<string, number>();
    for (const s of list) {
      for (const c of s.courses) counts.set(`${s.index} course ${canonical(c)}`, (counts.get(`${s.index} course ${canonical(c)}`) ?? 0) + 1);
      for (const p of s.placeholders ?? []) counts.set(`${s.index} placeholder ${canonical(p)}`, 1);
    }
    return counts;
  };
  const kept = entries(after);
  for (const [key, n] of entries(before)) if ((kept.get(key) ?? 0) < n) losses.push(`lost on save: ${key}`);
  const byTerm = new Map(after.map((s) => [s.index, s]));
  for (const s of before) {
    const merged = byTerm.get(s.index) as unknown as Record<string, unknown> | undefined;
    for (const [k, v] of Object.entries(s))
      if (!SEMESTER_KEYS.has(k) && canonical(merged?.[k]) !== canonical(v)) losses.push(`lost on save: ${s.index} field "${k}" (repeated term code with different values)`);
  }
  return losses;
}

export interface ExportReport {
  total: number;
  counts: Record<Status, number>;
  rows: RowReport[];
  /** Row ids that appear more than once in the export. */
  duplicateIds: string[];
}

export function checkExport(rows: unknown[], campusOf?: CampusOf): ExportReport {
  const reports = rows.map((r) => checkPlanRow(r, campusOf));
  const counts: Record<Status, number> = { fails: 0, "loses-data": 0, changes: 0, warnings: 0, ok: 0 };
  for (const r of reports) counts[r.status]++;
  const seen = new Set<string>();
  const duplicateIds = new Set<string>();
  for (const r of reports) (seen.has(r.id) ? duplicateIds : seen).add(r.id);
  return { total: reports.length, counts, rows: reports, duplicateIds: [...duplicateIds] };
}
