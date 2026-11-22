/**
 * A1 (Hadi's Claude, #99): every 2025 row shape loads through v2's real path, shows the right
 * courses, and survives load → save → load. The Supabase client is an in-memory `plans` table
 * that stores JSON copies (like jsonb), so only the network is faked.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Plan } from "@/domain/plan";
import { termLabel } from "@/domain/terms";
import { groupByYear } from "@/domain/planOps";
import { getCourses } from "@/server/catalog/courses";
import { planActions, usePlanStore } from "@/features/plan-editor/store";
import { Schedule } from "@/features/plan-editor/Schedule";
import { SupabasePlanRepository } from "./serverRepository";
import { LocalPlanRepository } from "./localRepository";
import { isPlan, normalizePlan } from "./validation";
import { planListSummary } from "./summary";
import { checkExport, checkPlanRow, readExport, type CampusOf } from "./check2025";
import { BROKEN_ROWS, C, FIXTURES_2025, LOCAL_AUTOSAVES_2025, OWNER } from "./__fixtures__/plans2025";

type Row = Record<string, unknown>;

/** In-memory `plans` table with the query chain SupabasePlanRepository uses. */
function fakeSupabase(seed: Row[]) {
  const table: Row[] = seed.map((r) => JSON.parse(JSON.stringify(r)));
  let clock = Date.parse("2026-11-22T12:00:00Z");
  class Query implements PromiseLike<{ data: unknown; error: null }> {
    private filters: ((r: Row) => boolean)[] = [];
    private op: { kind: "select" } | { kind: "update"; fields: Row } | { kind: "insert"; row: Row } = { kind: "select" };
    private window: [number, number] | null = null;
    select() {
      return this;
    }
    eq(col: string, v: unknown) {
      this.filters.push((r) => r[col] === v);
      return this;
    }
    is(col: string, v: unknown) {
      this.filters.push((r) => (r[col] ?? null) === v);
      return this;
    }
    not(col: string, _op: string, v: unknown) {
      this.filters.push((r) => (r[col] ?? null) !== v);
      return this;
    }
    gt(col: string, v: string) {
      this.filters.push((r) => typeof r[col] === "string" && Date.parse(r[col] as string) > Date.parse(v));
      return this;
    }
    order() {
      return this;
    }
    range(a: number, b: number) {
      this.window = [a, b];
      return this;
    }
    update(fields: Row) {
      this.op = { kind: "update", fields };
      return this;
    }
    insert(row: Row) {
      this.op = { kind: "insert", row };
      return this;
    }
    private run(): Row[] {
      if (this.op.kind === "insert") {
        const created = new Date((clock += 1000)).toISOString();
        const stored = JSON.parse(JSON.stringify({ id: `new-${table.length}`, created_at: created, deletion_scheduled_at: null, ...this.op.row }));
        table.push(stored);
        return [stored];
      }
      const hits = table.filter((r) => this.filters.every((f) => f(r)));
      if (this.op.kind === "update") for (const r of hits) Object.assign(r, JSON.parse(JSON.stringify(this.op.fields)));
      const out = hits.map((r) => JSON.parse(JSON.stringify(r)) as Row);
      return this.window ? out.slice(this.window[0], this.window[1] + 1) : out;
    }
    async maybeSingle() {
      return { data: this.run()[0] ?? null, error: null };
    }
    then<A, B>(ok?: ((v: { data: unknown; error: null }) => A | PromiseLike<A>) | null, fail?: ((e: unknown) => B | PromiseLike<B>) | null) {
      return Promise.resolve({ data: this.run(), error: null }).then(ok, fail);
    }
  }
  const client = {
    from: () => new Query(),
    rpc: async () => ({ data: "2026-12-22T12:00:00Z", error: null }),
  };
  return { table, repo: new SupabasePlanRepository(client as unknown as SupabaseClient, OWNER) };
}

/** What CloudPlanRepository returns: the API route's JSON, parsed. */
const overHttp = <T>(v: T): T => JSON.parse(JSON.stringify(v));

/** PlanLoader → PlanEditor: refuse binned plans, then `loadPlan` into the editor store. */
function openInEditor(plan: Plan | null): Plan {
  expect(plan).not.toBeNull();
  expect(plan!.deletion_scheduled_at).toBeNull();
  usePlanStore.getState().loadPlan(plan!);
  return usePlanStore.getState().plan!;
}

/** Course ids per term in card order, as the schedule renders them (`data-course-card="term:id"`). */
function renderedCards(plan: Plan): string[] {
  const html = renderToString(createElement(Schedule, { plan }));
  return [...html.matchAll(/data-course-card="([^"]+)"/g)].map((m) => m[1]);
}
const expectedCards = (plan: Plan, expected: Record<string, number[]>) =>
  plan.semesters.filter((s) => s.kind !== "prior").flatMap((s) => (expected[s.index] ?? []).map((id) => `${s.index}:${id}`));

let campusOf: CampusOf;
beforeAll(() => {
  const db = new DatabaseSync(path.resolve(__dirname, "../../../data/catalog.db"), { readOnly: true });
  const campuses = new Map((db.prepare("SELECT id, campus FROM classdistribution").all() as { id: number; campus: string }[]).map((r) => [r.id, r.campus]));
  db.close();
  campusOf = (id) => campuses.get(id) ?? null;
});
beforeEach(() => usePlanStore.setState({ plan: null, revision: 0 }));

describe("2025 plan rows in v2 (A1)", () => {
  it("covers the expected course ids with real catalog codes", () => {
    const [cs] = getCourses([C.CSCI1133]);
    expect(`${cs.dept} ${cs.number}`).toBe("CSCI 1133");
    const [morris] = getCourses([C.ECON1101_MORRIS]);
    expect(`${morris.dept} ${morris.number}`).toBe("ECON 1101");
  });

  for (const f of FIXTURES_2025) {
    describe(f.name, () => {
      it("is listed on My Plans with its course count", async () => {
        const { repo } = fakeSupabase([f.row]);
        const listed = await repo.list();
        expect(listed).toHaveLength(1);
        const plan = overHttp(listed[0]);
        expect(isPlan(plan)).toBe(true);
        const expectedEntries = Object.values(f.expected).flat().length;
        expect(planListSummary(plan, {}).courseEntries).toBe(expectedEntries);
        expect(plan.title).toBe((f.row.title as string | null) ?? "");
      });

      it("opens at /plan/[planId] and renders the right courses", async () => {
        const { repo } = fakeSupabase([f.row]);
        if (f.row.deletion_scheduled_at) {
          // PlanLoader refuses a binned plan; it opens after Recover.
          expect((await repo.get(f.row.id as string))!.deletion_scheduled_at).not.toBeNull();
          await repo.recover(f.row.id as string);
        }
        const plan = openInEditor(overHttp(await repo.get(f.row.id as string)));
        for (const s of plan.semesters) {
          expect(() => termLabel(s.index)).not.toThrow();
          expect(s.courses.map((c) => c.id)).toEqual(f.expected[s.index] ?? []);
        }
        expect(Object.keys(f.expected).every((term) => plan.semesters.some((s) => s.index === term))).toBe(true);
        expect(groupByYear(plan.semesters).flatMap((g) => g.semesters.map((s) => s.index))).toEqual(
          [...plan.semesters.map((s) => s.index)].sort(),
        );
        const cards = renderedCards(plan);
        expect(cards).toEqual(expectedCards(plan, f.expected));
        // The id means the same course to v2 as it did to 2025: where the row kept 2025's own code
        // (search drops, June 2025 details), v2's catalog has that code for the id. (Server rendering reads
        // the course cache's initial state, so codes are checked here rather than in the HTML.)
        for (const s of plan.semesters)
          for (const c of s.courses as unknown as Row[]) {
            const [course] = getCourses([c.id as number]);
            expect(course, `course ${c.id}`).toBeDefined();
            if (typeof c.dept_abbr === "string") expect(`${course.dept} ${course.number}`).toBe(`${c.dept_abbr} ${c.course_num}`);
          }
      });

      it("survives load → save → load, keeping every 2025 field", async () => {
        const { repo, table } = fakeSupabase([f.row]);
        const id = f.row.id as string;
        if (f.row.deletion_scheduled_at) await repo.recover(id);
        const first = openInEditor(overHttp(await repo.get(id)));
        await repo.save(overHttp(first));
        const second = openInEditor(overHttp(await repo.get(id)));
        expect(second.semesters).toEqual(first.semesters);
        expect(second.title).toBe(first.title);
        expect(second.programs).toEqual(first.programs);
        expect(second.created_at).toBe(f.row.created_at);
        // Nothing the row stored is gone: every stored course object is still there, as stored
        // (only a missing lock is filled in).
        const stored = table[0].semesters as { index: string; courses: Row[] }[];
        const original = normalizePlan(f.row as unknown as Plan).semesters as unknown as { index: string; courses: Row[] }[];
        const entries = (list: { index: string; courses: Row[] }[]) => list.flatMap((s) => s.courses.map((c) => `${s.index}:${JSON.stringify(c)}`)).sort();
        expect(entries(stored)).toEqual(entries(original));
        // Columns v2 doesn't write (e.g. June 2025's `major`) are untouched.
        for (const k of Object.keys(f.row)) if (!["title", "programs", "semesters", "last_updated", "deletion_scheduled_at"].includes(k)) expect(table[0][k]).toEqual(f.row[k]);
      });

      it("survives an edit: other courses keep their 2025 fields", async () => {
        const { repo, table } = fakeSupabase([f.row]);
        const id = f.row.id as string;
        if (f.row.deletion_scheduled_at) await repo.recover(id);
        const before = openInEditor(overHttp(await repo.get(id)));
        planActions.setTitle(`${before.title} (v2)`);
        const target = before.semesters.find((s) => s.courses.length);
        if (target) planActions.setLock(target.index, target.courses[0].id, "locked");
        await repo.save(overHttp(usePlanStore.getState().plan!));
        const after = openInEditor(overHttp(await repo.get(id)));
        expect(after.title).toBe(`${before.title} (v2)`);
        expect(after.semesters.map((s) => s.courses.map((c) => c.id))).toEqual(before.semesters.map((s) => s.courses.map((c) => c.id)));
        after.semesters.forEach((s, i) =>
          s.courses.forEach((c, j) => {
            const was = before.semesters[i].courses[j];
            expect({ ...c, lock: was.lock }).toEqual(was);
          }),
        );
        expect(table).toHaveLength(1);
      });

      it(`is reported as "${f.status}" by the export check`, () => {
        const report = checkPlanRow(f.row, campusOf);
        expect(report.status).toBe(f.status);
        expect(report.losesData).toEqual([]);
        expect(report.fails).toEqual([]);
      });
    });
  }

  for (const f of LOCAL_AUTOSAVES_2025) {
    it(`opens the 2025 browser autosave: ${f.name}`, async () => {
      const values = new Map([["plan", JSON.stringify(f.value)]]);
      const storage = {
        getItem: (k: string) => values.get(k) ?? null,
        setItem: (k: string, v: string) => void values.set(k, v),
        removeItem: (k: string) => void values.delete(k),
      } as Storage;
      const local = new LocalPlanRepository(storage);
      const plan = openInEditor(await local.get("autosave"));
      expect(plan).toMatchObject({ id: null, user_id: null, deletion_scheduled_at: null });
      for (const s of plan.semesters) expect(s.courses.map((c) => c.id)).toEqual(f.expected[s.index] ?? []);
      expect(values.get("plan")).toBe(JSON.stringify(f.value));
      await local.save(plan);
      expect((await local.get("autosave"))!.semesters).toEqual(plan.semesters);
    });
  }
});

describe("check-2025-plans (A1)", () => {
  it("fails rows v2 can't save, without throwing", () => {
    for (const b of BROKEN_ROWS) {
      const report = checkPlanRow(b.row, campusOf);
      expect(report.status, b.name).toBe("fails");
      expect(report.fails.join("\n"), b.name).toMatch(b.fails);
    }
    expect(checkPlanRow("nope").status).toBe("fails");
  });

  it("names the variants: lock fixes, term order, other campus, unknown ids", () => {
    const byName = (name: string) => checkPlanRow(FIXTURES_2025.find((f) => f.name.startsWith(name))!.row, campusOf);
    expect(byName("missing or unknown lock").changes.join()).toMatch(/3 courses have a missing or unknown lock/);
    expect(byName("years removed").changes.join()).toMatch(/out of term order/);
    expect(byName("other-campus").warnings.join()).toMatch(/other-campus course ids.*8382/);
    expect(byName("June 2025").notes.join()).toMatch(/columns v2 doesn't read.*major/);
    expect(byName("June 2025").notes.join()).toMatch(/class_desc/);
    const unknown = { ...FIXTURES_2025[0].row, semesters: [{ index: "1259", courses: [{ id: 999999, lock: "locked" }] }] };
    expect(checkPlanRow(unknown, campusOf).warnings.join()).toMatch(/not in data\/catalog.db.*999999/);
  });

  it("reports a repeated term whose fields would be dropped as losing data", () => {
    const row = {
      ...FIXTURES_2025[0].row,
      semesters: [
        { index: "1259", courses: [], kind: "abroad" },
        { index: "1259", courses: [], kind: "coop" },
      ],
    };
    expect(checkPlanRow(row).status).toBe("loses-data");
  });

  it("reads the json_agg export cell, plain arrays, JSON-string columns and NDJSON", () => {
    const rows = FIXTURES_2025.map((f) => f.row);
    expect(readExport(JSON.stringify([{ json_agg: rows }]))).toEqual(rows);
    expect(readExport(JSON.stringify({ rows }))).toEqual(rows);
    expect(readExport(rows.map((r) => JSON.stringify(r)).join("\n"))).toEqual(rows);
    const stringy = { ...rows[0], semesters: JSON.stringify(rows[0].semesters) };
    expect(checkPlanRow(stringy, campusOf).status).toBe("ok");
    const all = checkExport([...rows, rows[0]], campusOf);
    expect(all.total).toBe(rows.length + 1);
    expect(all.duplicateIds).toEqual([rows[0].id]);
    expect(all.counts.fails + all.counts["loses-data"]).toBe(0);
  });
});
