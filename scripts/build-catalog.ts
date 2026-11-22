/**
 * D1 (#97, Hadi's Claude): rebuild `data/catalog.db` from GopherGrades' `ProcessedData.db`.
 *
 *   NODE_USE_ENV_PROXY=1 node scripts/build-catalog.ts --source <path/to/ProcessedData.db> [--refresh] [--out <file>]
 *
 * Steps: copy GopherGrades' db → add `classdistribution.courseGroupId` → rebuild the Lib Ed tables from
 * CourseDog → integrity checks against the previous `data/catalog.db` → write `--out` (default
 * `data/catalog.db`) and `data/catalog-build.json`. Nothing is written if a check fails. Previous ids that
 * change course are reported, not fatal (Hadi, 2026-11-22: breaking changes are permitted).
 *
 * Source pin: samyok/gophergrades, the commit that last changed `ProcessedData.db` (below). Its data is
 * public and used with Social Coding UMN's permission (Hadi, `docs/human/roadmap.md`, "Launch"). Another
 * file is refused unless `--any-source` is given, so a rebuild is reproducible.
 *
 * CourseDog: every Twin Cities course version is read once (3 pages, one request at a time, with a
 * pause) and cached under `.cache/coursedog/catalog/`; `--refresh` re-fetches. Node's fetch only uses an
 * HTTPS proxy with `NODE_USE_ENV_PROXY=1`.
 *
 * courseGroupId (the CourseDog course group id requirements and Lib Ed use), first rule that applies:
 *   1. `onestop` is a CourseDog link `…/courses/<7 digits>` → those digits (v1's rule, any campus).
 *   2. Twin Cities, no link → the one CourseDog group whose current code is the row's subject + number,
 *      if no other row already uses it (heuristic, heuristics.md).
 *   A row the previous db mapped keeps its id, unless rule 1 now gives a group CourseDog lists as
 *   Active while the old one is Inactive (the course got a new group id; printed as a change).
 *
 * Lib Ed: `libed` holds the 13 Twin Cities designations and `libedAssociationTable` links each Twin
 * Cities row to the CLE codes on its group's current CourseDog version: the same source and
 * version rule the app uses live (`src/server/libed/`). GopherGrades' own tags are only compared.
 */
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { libEdCodes, TWIN_CITIES_LIBED } from "../src/domain/libed.ts";
import { termLabel } from "../src/domain/terms.ts";

export const GOPHERGRADES = {
  repo: "https://github.com/samyok/gophergrades",
  /** Last commit that changed ProcessedData.db (2026-11-05); HEAD was afb1c95 (2026-11-15). */
  commit: "4d9751e71193d75a3fd7612f19f3bbce3c6de166",
  sha256: "66be888fc0f7fc4e231f1c9cd7cd2da77869059299f95fdaba61150309a9be65",
};

const BASE = "https://app.coursedog.com/api/v1/cm/umn_umntc_peoplesoft";
const HEADERS = {
  Accept: "application/json",
  Origin: "https://umtc.catalog.prod.coursedog.com",
  Referer: "https://umtc.catalog.prod.coursedog.com/",
  "x-requested-with": "catalog",
};
const PAGE = 10_000;
const MAX_PAGES = 6;
const PAUSE_MS = 1_000;
const CAMPUS = "UMNTC";

const ROOT = process.cwd();
const CACHE = path.join(ROOT, ".cache", "coursedog", "catalog");
const PREVIOUS = path.join(ROOT, "data", "catalog.db");
const META = path.join(ROOT, "data", "catalog-build.json");

interface CdCourse {
  courseGroupId: string;
  deprecatedCourseGroupId?: string | null;
  subjectCode?: string;
  courseNumber?: string;
  effectiveStartDate?: string;
  status?: string;
  attributes?: unknown;
}

interface Row {
  id: number;
  campus: string;
  dept_abbr: string;
  course_num: string;
  class_desc: string;
  onestop: string | null;
}

type Rule = "onestop" | "code" | "previous";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const flag = (name: string) => process.argv.includes(name);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const sha256 = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");
const fail = (msg: string): never => {
  console.error(`\nBUILD FAILED: ${msg}`);
  process.exit(1);
};

/** One page of every course version, cached; requests are sequential and spaced out. */
async function cdPage(skip: number, refresh: boolean): Promise<{ total: number; rows: CdCourse[]; fetchedAt: string }> {
  const file = path.join(CACHE, `courses-${skip}.json`);
  if (!refresh && existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
  const url =
    `${BASE}/courses/search/%24filters?limit=${PAGE}&skip=${skip}` +
    "&columns=courseGroupId,deprecatedCourseGroupId,subjectCode,courseNumber,effectiveStartDate,status,attributes";
  for (let attempt = 1; ; attempt++) {
    await sleep(PAUSE_MS * attempt);
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(60_000) }).catch((e: unknown) => e as Error);
    if (!(res instanceof Error) && res.ok) {
      const body = (await res.json()) as { listLength?: number; data?: CdCourse[] };
      const page = { total: body.listLength ?? 0, rows: body.data ?? [], fetchedAt: new Date().toISOString() };
      writeFileSync(file, JSON.stringify(page));
      return page;
    }
    if (attempt >= 3) throw new Error(`CourseDog ${url}: ${res instanceof Error ? res.message : res.status}`);
  }
}

async function courseDog(refresh: boolean) {
  mkdirSync(CACHE, { recursive: true });
  const first = await cdPage(0, refresh);
  const pages = Math.ceil(first.total / PAGE);
  if (pages > MAX_PAGES) fail(`CourseDog lists ${first.total} course versions, more than ${PAGE * MAX_PAGES}; raise MAX_PAGES`);
  const rest = [];
  for (let p = 1; p < pages; p++) rest.push(await cdPage(p * PAGE, refresh));
  const rows = [first, ...rest].flatMap((p) => p.rows);
  if (rows.length < first.total) fail(`CourseDog returned ${rows.length} of ${first.total} course versions`);
  return { rows, fetchedAt: first.fetchedAt };
}

/** Same rule as `currentVersions` in src/server/libed/libEdIndex.ts: newest started version, else earliest future one. */
function currentVersions(rows: CdCourse[], today: string): Map<string, CdCourse> {
  const best = new Map<string, CdCourse>();
  for (const row of rows) {
    const id = row.courseGroupId;
    if (!id) continue;
    const start = row.effectiveStartDate ?? "";
    const current = best.get(id);
    const currentStart = current?.effectiveStartDate ?? "";
    const better =
      !current ||
      (start <= today && (currentStart > today || start > currentStart)) ||
      (start > today && currentStart > today && start < currentStart);
    if (better) best.set(id, row);
  }
  return best;
}

const fingerprint = (rows: Pick<Row, "id" | "campus" | "dept_abbr" | "course_num">[]) =>
  createHash("sha256")
    .update(rows.map((r) => `${r.id}|${r.campus}|${r.dept_abbr}|${r.course_num}`).join("\n"))
    .digest("hex");

/**
 * Lowest Twin Cities row id per group id. Before L11 this was the row requirements resolved a group to; since
 * L11 every row of a group counts (`findCourseRowsByGroupIds`), and the check only keeps groups stable.
 */
function resolution(rows: { id: number; campus: string; g: string | null }[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const r of [...rows].sort((a, b) => a.id - b.id)) if (r.campus === CAMPUS && r.g && !out.has(r.g)) out.set(r.g, r.id);
  return out;
}

/** "Race, Power, and Justice in the United States" / "Environment" → CLE code, for comparing GopherGrades' tags. */
function codeForName(name: string): string | undefined {
  const norm = (s: string) => s.toLowerCase().replace(/^the /, "").trim();
  return TWIN_CITIES_LIBED.find((d) => norm(d.label) === norm(name))?.code;
}

async function main() {
  const source = arg("--source");
  if (!source || !existsSync(source)) fail("pass --source <path to GopherGrades ProcessedData.db>");
  const src = source as string;
  const out = path.resolve(arg("--out") ?? PREVIOUS);
  const sourceSha = sha256(src);
  if (sourceSha !== GOPHERGRADES.sha256 && !flag("--any-source"))
    fail(`${src} has sha256 ${sourceSha}, not the pinned ${GOPHERGRADES.sha256} (gophergrades ${GOPHERGRADES.commit.slice(0, 7)}). Use --any-source to build from it anyway.`);
  if (!existsSync(PREVIOUS)) fail(`${PREVIOUS} is missing; the checks compare against it`);

  // --- previous build: ids, mapping and Lib Ed counts to compare against
  const prev = new DatabaseSync(PREVIOUS, { readOnly: true });
  const prevRows = prev
    .prepare("SELECT id, campus, dept_abbr, course_num, class_desc, courseGroupId AS g FROM classdistribution ORDER BY id")
    .all() as unknown as (Row & { g: string | null })[];
  const prevLibEd = {
    designations: (prev.prepare("SELECT COUNT(*) AS n FROM libed").get() as { n: number }).n,
    associations: (prev.prepare("SELECT COUNT(*) AS n FROM libedAssociationTable").get() as { n: number }).n,
  };
  prev.close();

  // --- CourseDog
  const today = new Date().toISOString().slice(0, 10);
  const cd = await courseDog(flag("--refresh"));
  const current = currentVersions(cd.rows, today);
  const active = new Set(cd.rows.filter((r) => r.status === "Active").map((r) => r.courseGroupId));
  const groupsByCode = new Map<string, Set<string>>();
  for (const [g, v] of current) {
    const code = `${v.subjectCode} ${v.courseNumber}`;
    groupsByCode.set(code, (groupsByCode.get(code) ?? new Set()).add(g));
  }
  console.log(`CourseDog: ${cd.rows.length} course versions, ${current.size} groups (fetched ${cd.fetchedAt})`);

  // --- copy the source and add courseGroupId
  const tmp = `${out}.tmp`;
  rmSync(tmp, { force: true });
  copyFileSync(src, tmp);
  const db = new DatabaseSync(tmp);
  const cols = db.prepare("PRAGMA table_info(classdistribution)").all() as { name: string }[];
  if (cols.some((c) => c.name === "courseGroupId")) fail("the source already has classdistribution.courseGroupId; check the source");
  db.exec("ALTER TABLE classdistribution ADD COLUMN courseGroupId TEXT");
  const rows = db
    .prepare("SELECT id, campus, dept_abbr, course_num, class_desc, onestop FROM classdistribution ORDER BY id")
    .all() as unknown as Row[];
  const byId = new Map(rows.map((r) => [r.id, r]));

  // Report 1: previous ids that are gone or now name another course. Not fatal (Hadi, 2026-11-22:
  // "backwards compatibility does not matter"), but the e2e suite pins some ids, so they are listed.
  const changedIds = prevRows.filter((p) => {
    const r = byId.get(p.id);
    return !r || r.campus !== p.campus || r.dept_abbr !== p.dept_abbr || r.course_num !== p.course_num;
  });
  const changedIdSet = new Set(changedIds.map((p) => p.id));

  const assigned = new Map<number, { g: string; rule: Rule }>();
  const prevG = new Map(prevRows.map((p) => [p.id, p.g]));
  for (const r of rows) {
    const g = r.onestop?.match(/coursedog\.com\/courses\/(\d{7})(?:[/?#]|$)/)?.[1];
    if (g) assigned.set(r.id, { g, rule: "onestop" });
  }
  // Previous mapping wins, except when GopherGrades' link moved to an Active group from an Inactive one.
  const remapped: { id: number; code: string; from: string; to: string }[] = [];
  for (const [id, old] of prevG) {
    if (!old || changedIdSet.has(id)) continue;
    const now = assigned.get(id);
    if (now?.g === old) continue;
    const r = byId.get(id)!;
    if (now && active.has(now.g) && !active.has(old)) remapped.push({ id, code: `${r.dept_abbr} ${r.course_num}`, from: old, to: now.g });
    else assigned.set(id, { g: old, rule: "previous" });
  }
  const used = new Set([...assigned].filter(([id]) => byId.get(id)!.campus === CAMPUS).map(([, a]) => a.g));
  for (const r of rows) {
    if (r.campus !== CAMPUS || assigned.has(r.id)) continue;
    // A link that isn't a CourseDog one (14 legacy onestop2 links) is left alone: each names a course
    // whose current group already belongs to its renumbered row.
    if (r.onestop) continue;
    const found = groupsByCode.get(`${r.dept_abbr} ${r.course_num}`);
    if (found?.size === 1) {
      const [g] = found;
      if (!used.has(g)) {
        assigned.set(r.id, { g, rule: "code" });
        used.add(g);
      }
    }
  }
  const update = db.prepare("UPDATE classdistribution SET courseGroupId = ? WHERE id = ?");
  db.exec("BEGIN");
  for (const [id, a] of assigned) update.run(a.g, id);
  db.exec("COMMIT");

  // Check 2: mapping is equal or better, and every previously mapped row keeps its id (except `remapped`).
  const remappedIds = new Set(remapped.map((r) => r.id));
  const lost = prevRows.filter((p) => p.g && !changedIdSet.has(p.id) && assigned.get(p.id)?.g !== p.g && !remappedIds.has(p.id));
  if (lost.length) fail(`${lost.length} previously mapped rows lost or changed their courseGroupId`);
  const countMapped = (list: { id: number; campus: string }[], has: (id: number) => boolean, campus?: string) =>
    list.filter((r) => (!campus || r.campus === campus) && has(r.id)).length;
  const mapping = {
    before: { all: countMapped(prevRows, (id) => !!prevG.get(id)), tc: countMapped(prevRows, (id) => !!prevG.get(id), CAMPUS) },
    oldRowsAfter: { all: countMapped(prevRows, (id) => assigned.has(id)), tc: countMapped(prevRows, (id) => assigned.has(id), CAMPUS) },
    after: { all: countMapped(rows, (id) => assigned.has(id)), tc: countMapped(rows, (id) => assigned.has(id), CAMPUS) },
  };
  if (mapping.oldRowsAfter.all < mapping.before.all || mapping.oldRowsAfter.tc < mapping.before.tc) fail("courseGroupId mapping got worse");

  // Check 3: every group the previous db resolved still resolves to the same row (except `remapped`).
  const before = resolution(prevRows.filter((p) => !changedIdSet.has(p.id)));
  const after = resolution(rows.map((r) => ({ id: r.id, campus: r.campus, g: assigned.get(r.id)?.g ?? null })));
  const remappedGroups = new Set(remapped.flatMap((r) => [r.from, r.to]));
  const moved = [...before].filter(([g, id]) => after.get(g) !== id && !remappedGroups.has(g));
  if (moved.length) fail(`${moved.length} course groups now resolve to a different row, e.g. ${moved.slice(0, 5).join(" ")}`);

  // --- Lib Ed from CourseDog
  db.exec("DELETE FROM libedAssociationTable; DELETE FROM libed;");
  const gg = new Map<number, Set<string>>(); // GopherGrades' tags, for the comparison only
  const srcDb = new DatabaseSync(src, { readOnly: true });
  for (const r of srcDb
    .prepare("SELECT a.right_id AS id, l.name FROM libedAssociationTable a JOIN libed l ON l.id = a.left_id")
    .all() as unknown as { id: number; name: string }[]) {
    const code = codeForName(r.name);
    if (code && byId.get(r.id)?.campus === CAMPUS) gg.set(r.id, (gg.get(r.id) ?? new Set()).add(code));
  }
  const ggTotal = (srcDb.prepare("SELECT COUNT(*) AS n FROM libedAssociationTable").get() as { n: number }).n;
  const ggDesignations = (srcDb.prepare("SELECT COUNT(*) AS n FROM libed").get() as { n: number }).n;
  srcDb.close();
  const libedId = new Map(TWIN_CITIES_LIBED.map((d, i) => [d.code, i + 1]));
  const insLibed = db.prepare("INSERT INTO libed (id, name) VALUES (?, ?)");
  const insAssoc = db.prepare("INSERT INTO libedAssociationTable (left_id, right_id) VALUES (?, ?)");
  const compare = { both: 0, onlyCourseDog: 0, onlyGopherGrades: 0 };
  let associations = 0;
  db.exec("BEGIN");
  for (const d of TWIN_CITIES_LIBED) insLibed.run(libedId.get(d.code)!, d.label);
  for (const r of rows) {
    if (r.campus !== CAMPUS) continue;
    const g = assigned.get(r.id)?.g;
    const codes = g ? libEdCodes(current.get(g)?.attributes) : [];
    for (const code of codes) {
      insAssoc.run(libedId.get(code)!, r.id);
      associations++;
    }
    const theirs = gg.get(r.id) ?? new Set();
    for (const c of codes) compare[theirs.has(c) ? "both" : "onlyCourseDog"]++;
    for (const c of theirs) if (!codes.includes(c)) compare.onlyGopherGrades++;
  }
  db.exec("COMMIT");

  // Check 4: SQLite integrity and the Lib Ed foreign keys.
  const integrity = (db.prepare("PRAGMA integrity_check").get() as { integrity_check: string }).integrity_check;
  if (integrity !== "ok") fail(`integrity_check: ${integrity}`);
  const badFk = db.prepare("PRAGMA foreign_key_check(libedAssociationTable)").all();
  if (badFk.length) fail(`${badFk.length} libedAssociationTable rows break a foreign key`);
  db.exec("VACUUM");

  const terms = db.prepare("SELECT MIN(term) AS lo, MAX(term) AS hi FROM termdistribution").get() as { lo: number; hi: number };
  const libEd = { designations: TWIN_CITIES_LIBED.length, associations };
  const titleChanges = prevRows
    .filter((p) => !changedIdSet.has(p.id) && byId.get(p.id)!.class_desc !== p.class_desc)
    .map((p) => ({ id: p.id, code: `${p.dept_abbr} ${p.course_num}`, from: p.class_desc, to: byId.get(p.id)!.class_desc }));
  const byRule: Record<string, number> = {};
  for (const [id, a] of assigned) if (byId.get(id)!.campus === CAMPUS) byRule[a.rule] = (byRule[a.rule] ?? 0) + 1;
  const prevMax = prevRows.at(-1)?.id ?? 0;
  const meta = {
    builtBy: "scripts/build-catalog.ts (D1, #97)",
    builtOn: today,
    gophergrades: GOPHERGRADES,
    courseDogFetchedAt: cd.fetchedAt,
    grades: { firstTerm: String(terms.lo), lastTerm: String(terms.hi), dataThrough: termLabel(String(terms.hi)) },
    courses: { total: rows.length, twinCities: rows.filter((r) => r.campus === CAMPUS).length, previous: prevRows.length },
    previousIds: { count: prevRows.length, maxId: prevMax, fingerprint: fingerprint(prevRows), changed: changedIds.map((p) => p.id) },
    courseGroupId: { ...mapping, twinCitiesByRule: byRule, remapped },
    libEd: { before: prevLibEd, gophergrades: { designations: ggDesignations, associations: ggTotal }, after: libEd, compareTwinCities: compare },
    titleChanges: titleChanges.length,
  };
  db.close();
  renameSync(tmp, out);
  if (out === path.resolve(PREVIOUS)) writeFileSync(META, `${JSON.stringify(meta, null, 2)}\n`);

  console.log(`\nWrote ${path.relative(ROOT, out)} (${(statSync(out).size / 1e6).toFixed(1)} MB)`);
  console.log(`Grades ${terms.lo}–${terms.hi} (through ${meta.grades.dataThrough}); ${rows.length} courses, ${prevRows.length} previous`);
  console.log(
    changedIds.length
      ? `Previous ids: ${changedIds.length} of ${prevRows.length} are gone or name another course: ${changedIds.slice(0, 20).map((p) => `${p.id} ${p.dept_abbr} ${p.course_num}`).join(", ")}`
      : `Previous ids: all ${prevRows.length} unchanged (campus, subject, number); fingerprint ${meta.previousIds.fingerprint}`,
  );
  console.log(`courseGroupId mapped: before ${mapping.before.all} (TC ${mapping.before.tc}); same rows after ${mapping.oldRowsAfter.all} (TC ${mapping.oldRowsAfter.tc}); all rows after ${mapping.after.all} of ${rows.length} (TC ${mapping.after.tc} of ${meta.courses.twinCities})`);
  console.log(`  TC by rule: ${JSON.stringify(byRule)}`);
  for (const r of remapped) console.log(`  remapped ${r.id} ${r.code}: ${r.from} (Inactive) → ${r.to} (Active)`);
  console.log(`  groups resolving to the same row as before: ${[...before].filter(([g, id]) => after.get(g) === id).length} of ${before.size}`);
  console.log(`Lib Ed: before ${prevLibEd.designations} / ${prevLibEd.associations}; GopherGrades ${ggDesignations} / ${ggTotal}; after ${libEd.designations} / ${libEd.associations}`);
  console.log(`  TC tags vs GopherGrades: ${JSON.stringify(compare)}`);
  console.log(`Title changes on previous ids: ${titleChanges.length}`);
  for (const t of titleChanges.slice(0, Number(arg("--titles") ?? 15))) console.log(`  ${t.id} ${t.code}: "${t.from}" → "${t.to}"`);
}

await main();
