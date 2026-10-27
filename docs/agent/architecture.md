# v2 Architecture

> Written by **Hadi's Claude** (Claude Code, Opus 5.5), 2026-10-26.
> Chosen by Hadi's Claude so Phase A could start (Hadi delegated implementation). Michael's Codex: challenge anything here in `codex-notes.md`.

## Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js 16.4** App Router, React 19.3, `cacheComponents` on | Same family as 2025; current major. **Read `node_modules/next/dist/docs/` before using an API from memory**, because v16 changed a lot (`proxy.ts` replaces `middleware.ts`, async `params`, `use cache`) |
| Language | TypeScript **strict** | 2025 ran with strict off. Not repeating that |
| Styling | Tailwind v4 + design tokens in `src/app/globals.css` | One source of truth (2026 ADR-0004). No raw hex outside `globals.css` |
| UI primitives | Radix (`@radix-ui/react-*`) + our own components in `src/components/ui/` | Mantine was kept in 2026 only to avoid a migration. A rewrite has no migration cost |
| Client state | zustand | Small stores with a clear contract between features |
| Drag and drop | `@dnd-kit/core` + `@dnd-kit/sortable` | Supports grid layouts and one drag context for rail + search + schedule |
| Course catalog | `data/catalog.db` (2025 `ProcessedData.db`, unchanged), read with **`node:sqlite`** (no native deps), server-only | Course ids are what 2025 plans stored. Same file = same ids = old plans load. Data covers Spring 2017 – Fall 2024 |
| Auth + plan storage | Supabase (same `plans` row shape as 2025) | Existing users' plans keep working |
| Program requirements | UMN CourseDog API (fetched server-side, cached) | Same source as 2025 |
| Tests | Vitest (pure logic + catalog queries) | |
| CI | GitHub Actions: lint, typecheck, test, build on every PR into `v2/**` | |
| Node | ≥ 22.13 (`node:sqlite` unflagged) | |

## Read-only snapshot sharing — Michael's Codex

> Written by **Michael's Codex**, 2026-10-27.

`src/features/sharing/snapshot.ts` exports `encodeSnapshot(plan)`, `decodeSnapshot(token, now?)`, and `copySnapshot(plan, now?)`. The bounded, versioned URL-fragment format carries only title, program IDs and semester/course/lock tuples. Cloud plan/owner IDs, access lists, timestamps and deletion state are excluded. Decode validates the existing plan constraints and creates detached identity/lifecycle fields. Copy always creates a new row/autosave; it never updates a sender's cloud plan.

`<SharePlanButton plan disabled? />` generates a snapshot link from an explicit action on an active My Plans row. `/share#v1.…` renders a separate read-only view without mounting PlanEditor, replacing the plan store, or saving automatically. Recipients explicitly copy to their own My Plans or browser autosave; overwriting an existing browser autosave requires confirmation. This is a fixed snapshot with no revocation or live updates. No production plans schema, RLS, API ownership contract or `can_view` behavior changes.

## Layout

```
data/catalog.db                 read-only course catalog (do not modify)
src/
  domain/                       pure types + logic, no React, no I/O (terms, course, plan)
  contracts/                    interfaces between features (PlanRepository)
  server/catalog/               catalog queries (server-only)
  app/                          routes (pages + API route handlers)
  features/<feature>/           everything for one feature: components, stores, hooks
  components/ui/                shared primitives
```

## Contracts between features

| Contract | File | Provided by | Used by |
|---|---|---|---|
| Plan shape (2025-compatible) | `src/domain/plan.ts` | Hadi's Claude | everyone |
| Term codes (`"1259"` = Fall 2025) | `src/domain/terms.ts` | Hadi's Claude | everyone |
| Course types | `src/domain/course.ts` | Hadi's Claude | everyone |
| `GET /api/courses/search?q=` → `CourseSummary[]` | `src/app/api/courses/search/route.ts` | Hadi's Claude | search, transcript import |
| `GET /api/courses?ids=` → `CourseDetails[]` | `src/app/api/courses/route.ts` | Hadi's Claude | course cache |
| `GET /api/courses/[courseId]/instructors` → `InstructorInsight[]` (named instructor/term/grade aggregates; Twin Cities only; invalid ID 400, catalog unavailable 503; unknown ID empty) | `src/server/catalog/instructors.ts`, new API route, `src/features/preview/instructor.ts` | Michael's Codex (B9 assignment on #16) | `<InstructorInsights courseId />` in previews; alphabetical history, ≥20 letter grades for GPA, loading/empty/error/retry states; RMP deferred |
| `useCourse(id)`, `useCourses(ids)`, `fetchCourses(ids)` | `src/features/catalog/courseCache.ts` | Hadi's Claude | preview, cards, requirements |
| `GET /api/programs/:programGroupId` → `Program` (requirements, courses resolved to catalog ids) | `src/app/api/programs/[id]/route.ts` | Hadi's Claude | requirements rail |
| `CourseDetails.prereqText` (prerequisite clause) + `parsePrereqs` / `checkPrereqs` | `src/domain/course.ts`, `src/domain/prereqs.ts` | Hadi's Claude | schedule warnings, preview |
| `findCourseIdsByCode()` (server) | `src/server/catalog/courses.ts` | Hadi's Claude | transcript import |
| `usePlanStore`: `plan`, `revision`, `loadPlan`, `patchMeta`, `subscribe` | `src/features/plan-editor/store.ts` | Hadi's Claude | autosave |
| `planActions` (`addCourse`, `removeCourse`, `moveCourse`, `setLock`, …) | `src/features/plan-editor/store.ts` | Hadi's Claude | preview (lock toggle), transcript import |
| `useCourseInfo(id)`, `useCreditTotal(ids)` | `src/features/catalog/courseCache.ts` | Hadi's Claude | anywhere a course or credit sum is shown |
| `<PlanEditor initialPlan={plan} />` | `src/features/plan-editor/PlanEditor.tsx` | Hadi's Claude | plan route pages |
| `<DisplaySettingsForm />` | `src/features/plan-editor/DisplaySettingsForm.tsx` | Hadi's Claude | Settings modal |
| `usePreviewStore`: `openPreview`, `hoverPreview`, `closePreview` | `src/features/preview/store.ts` | Michael's Codex | cards, search, requirements |
| `<PreviewLayer />` | `src/features/preview/PreviewLayer.tsx` | Michael's Codex | plan editor |
| `<UserMenu />` | `src/features/auth/UserMenu.tsx` | Michael's Codex | top bar |
| `<SaveStatus />` | `src/features/plans/SaveStatus.tsx` | Michael's Codex | plan header |
| `PlanRepository` | `src/contracts/plan-repository.ts` | interface: Hadi's Claude · impls: Michael's Codex | plan routes, My Plans |
| APAS extension ↔ page messages (`window.postMessage`, nonce per import; report kept in memory only) | `src/features/apas/protocol.ts` + `extension/src/protocol.js` (kept in sync by a test) | Ishaan's Claude | `/plan/apas`, the APAS import extension; the B1 parser later |

To change a contract, say so in the PR description under **Contract change**. The other side signs off in review.

## Advisor PDF export — Michael's Codex

> Written by **Michael's Codex**, 2026-10-27.

`src/features/export/advisorPdf.ts` exports `createAdvisorPdf(plan, courses, options)` → `{ bytes, pages, missingCourses }` and `advisorFileName(title)`. It consumes a current `Plan` snapshot and catalog summaries without changing them. Standard four-year plans fit one A4 landscape page; long or dense plans continue onto labelled pages instead of omitting courses. Optional program names and unofficial audit counts can be included.

`ExportPlanButton` is mounted beside `SaveStatus` in the plan header. The PDF library is loaded only when requested. The snapshot and PDF remain in the browser; only missing public catalog details are fetched through the existing courses API. This feature does not require an account, a new API route, or a schema/RLS change.
