import { test as base, expect, type Page } from "@playwright/test";
import { createEmptyPlan, type Plan } from "../src/domain/plan";
import type { Program } from "../src/domain/requirements";
import { termLabel, type TermCode } from "../src/domain/terms";
import { AUTOSAVE_KEY } from "../src/features/plans/localRepository";

/**
 * Shared setup for the A3 smoke suite (Hadi's Claude, 2026-11-22).
 *
 * Nothing here needs the network: routes backed by UMN's CourseDog API are answered from the fixtures
 * below, and any request to a host other than the app (Supabase, analytics, fonts) is aborted. Routes
 * that only read the bundled `data/catalog.db` (search, course details, departments, instructors) run
 * for real, so the suite exercises the actual catalog queries.
 */

/** Real catalog ids from `data/catalog.db`. */
export const COURSES = {
  csci1933: { id: 94, code: "CSCI 1933", title: "Introduction to Algorithms and Data Structures" },
  csci2011: { id: 77, code: "CSCI 2011", title: "Discrete Structures of Computer Science" },
  csci2041: { id: 1473, code: "CSCI 2041", title: "Advanced Programming Principles" },
} as const;

/** The program picked in the flows (a real CourseDog program group id from programOptions.json). */
export const PROGRAM = { id: "019627107", name: "Computer Science B.S. Comp.Sc." } as const;

/**
 * CSCI 2041 is given a fall-only offering history (Fall 2017 – Fall 2024), so the ‹ › arrows have one
 * right answer whatever the catalog says after a data refresh: Fall → the next Fall.
 */
export const FALL_ONLY_TERMS = ["1179", "1189", "1199", "1209", "1219", "1229", "1239", "1249"];

const option = (c: (typeof COURSES)[keyof typeof COURSES]) => ({
  groupId: `e2e-${c.id}`,
  courseId: c.id,
  code: c.code,
  title: c.title,
  credits: { min: 4, max: 4 },
  rows: [{ courseId: c.id, code: c.code, title: c.title, credits: { min: 4, max: 4 } }],
});

/** Stand-in for `GET /api/programs/:id` (normally CourseDog, normalized server-side). */
export const PROGRAM_FIXTURE: Program = {
  id: PROGRAM.id,
  name: PROGRAM.name,
  type: "Major",
  requirements: [
    {
      id: "e2e-core",
      name: "Lower division core",
      notes: null,
      rules: [
        {
          id: "e2e-core-courses",
          kind: "courses",
          name: "Take all of these courses",
          notes: null,
          choices: [{ options: [option(COURSES.csci1933)] }, { options: [option(COURSES.csci2011)] }, { options: [option(COURSES.csci2041)] }],
          minCourses: 3,
          minCredits: 0,
        },
      ],
    },
  ],
};

/** Stub every CourseDog-backed route and block other hosts. Call before the first navigation. */
export async function stubBackends(page: Page, baseURL: string) {
  const origin = new URL(baseURL).origin;
  await page.route(
    (url) => url.origin !== origin && /^https?:$/.test(url.protocol),
    (route) => route.abort("blockedbyclient"),
  );
  await page.route("**/api/programs/*", (route) => {
    const id = decodeURIComponent(new URL(route.request().url()).pathname.split("/").pop() ?? "");
    return id === PROGRAM.id
      ? route.fulfill({ json: PROGRAM_FIXTURE })
      : route.fulfill({ status: 404, json: { error: "Program not found" } });
  });
  // Lib Ed designations: no designations for any course.
  await page.route("**/api/libed?*", (route) => {
    const ids = (new URL(route.request().url()).searchParams.get("ids") ?? "").split(",").filter(Boolean);
    return route.fulfill({ json: Object.fromEntries(ids.map((id) => [id, []])) });
  });
  await page.route("**/api/minors?*", (route) => route.fulfill({ json: { checked: 0, minors: [] } }));
  await page.route("**/api/catalog-check", (route) =>
    route.fulfill({ json: { items: [], unavailable: [], checkedAt: new Date().toISOString() } }),
  );
  // Course details come from the real catalog; only CSCI 2041's offering history is pinned.
  await page.route("**/api/courses?*", async (route) => {
    try {
      const response = await route.fetch();
      const body = (await response.json()) as { id: number; termsOffered: string[] }[];
      for (const c of body) if (c.id === COURSES.csci2041.id) c.termsOffered = FALL_ONLY_TERMS;
      await route.fulfill({ response, json: body });
    } catch (error) {
      // A reload or the end of the test cancels the request mid-flight; nothing is waiting for it then.
      if (!page.isClosed() && !/disposed|closed|cancel/i.test(String(error))) throw error;
    }
  });
}

/** Terms of a fresh plan made today: Fall of this year, then 4 years of Fall/Spring/Summer. */
export function freshTerms(): TermCode[] {
  return createEmptyPlan().semesters.map((s) => s.index);
}

export const label = termLabel;

/** A plan as the app would autosave it, with courses placed by term. */
export function seededPlan(courses: Partial<Record<TermCode, number[]>>, title = "Smoke test plan"): Plan {
  const plan = createEmptyPlan();
  plan.title = title;
  plan.programs = [PROGRAM.id];
  for (const s of plan.semesters) s.courses = (courses[s.index] ?? []).map((id) => ({ id, lock: "unlocked" as const }));
  return plan;
}

/** Put `plan` in this browser's autosave and open it in the editor. */
export async function openSeeded(page: Page, plan: Plan) {
  // Seed once per tab (a sessionStorage flag), so later reloads read what the app itself saved.
  await page.addInitScript(
    ([key, value]) => {
      try {
        if (window.location.protocol.startsWith("http") && !sessionStorage.getItem("e2e:seeded")) {
          localStorage.setItem(key, value);
          sessionStorage.setItem("e2e:seeded", "1");
        }
      } catch {
        /* about:blank and other opaque origins have no storage. */
      }
    },
    [AUTOSAVE_KEY, JSON.stringify(plan)] as const,
  );
  await page.goto("/plan/autosave");
  await expect(page.getByRole("combobox", { name: "Search courses" })).toBeVisible();
}

/** A semester's section in the schedule (each is a `<section aria-label="Fall 2026">`). */
export function semester(page: Page, term: TermCode) {
  return page.getByRole("region", { name: termLabel(term), exact: true });
}

/** A planned course card inside a semester. */
export function card(page: Page, term: TermCode, course: (typeof COURSES)[keyof typeof COURSES]) {
  return semester(page, term).getByRole("button", { name: `${course.code}, ${course.title}`, exact: true });
}

export const test = base.extend<{ stubbed: Page }>({
  // `provide`, not `use`: the React hooks lint rule would read `use(page)` as a hook call.
  stubbed: async ({ page, baseURL }, provide) => {
    await stubBackends(page, baseURL ?? "http://localhost:3101");
    await provide(page);
    await page.unrouteAll({ behavior: "ignoreErrors" });
  },
});

export { expect };
