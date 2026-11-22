// Relative `.ts` imports so `scripts/check-2025-plans.ts` can run this file in plain Node (A1, Hadi's Claude).
import { isSemesterKind, MAX_PLACEHOLDERS_PER_SEMESTER, type LockState, type Plan } from "../../domain/plan.ts";

const LOCKS: readonly unknown[] = ["locked", "unlocked", "autofilled"] satisfies LockState[];

/**
 * Written by Michael's Codex; 2025 row rules added by Hadi's Claude (A1, #99).
 * Turns a stored `plans` row (or a 2025 browser autosave) into a v2 `Plan`. Every rule only fills
 * what is missing, so nothing a 2025 row holds is dropped; see `heuristics.md` ("2025 plan rows"):
 * - nullable array columns (`programs`, `can_view`) → `[]`
 * - a null `title` (rows from before the column existed) → `""`
 * - a null `last_updated` → `created_at`
 * - a course whose `lock` is missing or unknown → `"unlocked"`, exactly what 2025's loader did
 *   (`frontend/src/app/plan/[planId]/page.tsx` on `main` and every earlier branch).
 * Extra fields (2025 search drops stored `dept_abbr`, `course_num`, `priority`; June 2025 rows
 * stored whole course details) are kept as they are. Anything else is left for `isPlan` to reject.
 */
export function normalizePlan(row: Plan): Plan {
  return {
    ...row,
    title: row.title ?? "",
    programs: row.programs ?? [],
    can_view: row.can_view ?? [],
    last_updated: row.last_updated ?? row.created_at,
    semesters: Array.isArray(row.semesters) ? row.semesters.map(normalizeSemesterLocks) : row.semesters,
  };
}

function normalizeSemesterLocks(semester: Plan["semesters"][number]): Plan["semesters"][number] {
  if (!semester || !Array.isArray(semester.courses)) return semester;
  if (semester.courses.every((c) => !isObject(c) || LOCKS.includes(c.lock))) return semester;
  return {
    ...semester,
    courses: semester.courses.map((c) => (isObject(c) && !LOCKS.includes(c.lock) ? { ...c, lock: "unlocked" } : c)),
  };
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const isTime = (v: unknown) => typeof v === "string" && Number.isFinite(Date.parse(v));

/**
 * Written by Hadi's Claude (A1), from Michael's Codex's `isPlan` rules: why a value is not a
 * storable plan, one message per broken field (at most one per semester). Empty = valid.
 * Used by `isPlan` and by `scripts/check-2025-plans.ts`, so the script reports exactly what saving would reject.
 */
export function planProblems(value: unknown): string[] {
  if (!isObject(value)) return ["not an object"];
  const p = value;
  const out: string[] = [];
  if (!(p.id === null || typeof p.id === "string")) out.push("id is not a string or null");
  if (!(p.user_id === null || typeof p.user_id === "string")) out.push("user_id is not a string or null");
  if (typeof p.title !== "string") out.push("title is not a string");
  else if (p.title.length > 300) out.push("title is longer than 300 characters");
  if (!Array.isArray(p.programs)) out.push("programs is not an array");
  else if (p.programs.length > 50) out.push("more than 50 programs");
  else if (!p.programs.every((id) => typeof id === "string" && id.length <= 100)) out.push("a program id is not a string of ≤ 100 characters");
  if (!Array.isArray(p.can_view) || !p.can_view.every((id) => typeof id === "string")) out.push("can_view is not an array of strings");
  if (!isTime(p.created_at)) out.push("created_at is not a timestamp");
  if (!isTime(p.last_updated)) out.push("last_updated is not a timestamp");
  if (!(p.deletion_scheduled_at === null || isTime(p.deletion_scheduled_at))) out.push("deletion_scheduled_at is not a timestamp or null");
  if (!Array.isArray(p.semesters)) {
    out.push("semesters is not an array");
    return out;
  }
  if (p.semesters.length > 150) out.push("more than 150 semesters");
  p.semesters.forEach((s: unknown, i) => {
    const problem = semesterProblem(s);
    if (problem) out.push(`semester ${i}${isObject(s) && typeof s.index === "string" ? ` (${s.index})` : ""}: ${problem}`);
  });
  return out;
}

function semesterProblem(s: unknown): string | null {
  if (!isObject(s)) return "not an object";
  if (typeof s.index !== "string" || !/^1\d{2}[359]$/.test(s.index)) return `term code ${JSON.stringify(s.index)} is not a UMN term like "1259"`;
  if (!Array.isArray(s.courses)) return "courses is not an array";
  if (s.courses.length > 100) return "more than 100 courses";
  for (const c of s.courses) {
    if (!isObject(c)) return "a course is not an object";
    if (!(typeof c.id === "number" && Number.isSafeInteger(c.id) && c.id > 0)) return `course id ${JSON.stringify(c.id)} is not a positive integer`;
    if (!LOCKS.includes(c.lock)) return `course ${c.id} has lock ${JSON.stringify(c.lock)}`;
  }
  if (!isPlaceholderList(s.placeholders)) return "invalid placeholders";
  if (!(s.kind === undefined || isSemesterKind(s.kind))) return `unknown semester kind ${JSON.stringify(s.kind)}`;
  return null;
}

/** Written by Michael's Codex. Accept only the 2025 persisted row format. */
export function isPlan(value: unknown): value is Plan {
  return planProblems(value).length === 0;
}

/** Written by Ishaan's Claude (B2). Optional per-semester placeholders; absent on 2025 rows. */
function isPlaceholderList(value: unknown): boolean {
  if (value === undefined) return true;
  return (
    Array.isArray(value) &&
    value.length <= MAX_PLACEHOLDERS_PER_SEMESTER &&
    value.every(
      (p) =>
        p &&
        typeof p.key === "string" &&
        p.key.length > 0 &&
        p.key.length <= 40 &&
        typeof p.label === "string" &&
        p.label.trim().length > 0 &&
        p.label.length <= 80 &&
        typeof p.credits === "number" &&
        Number.isFinite(p.credits) &&
        p.credits >= 0 &&
        p.credits <= 20 &&
        (p.libEd === undefined ||
          (typeof p.libEd === "string" && /^[A-Z]{2,5}$/.test(p.libEd))),
    ) &&
    new Set(value.map((p) => p.key)).size === value.length
  );
}
