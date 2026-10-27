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
| `useCourse(id)`, `useCourses(ids)`, `fetchCourses(ids)` | `src/features/catalog/courseCache.ts` | Hadi's Claude | preview, cards, requirements |
| `GET /api/programs/:programGroupId` → `Program` (requirements, courses resolved to catalog ids) | `src/app/api/programs/[id]/route.ts` | Hadi's Claude | requirements rail |
| `CourseDetails.prereqText` (prerequisite clause) + `parsePrereqs` / `checkPrereqs` | `src/domain/course.ts`, `src/domain/prereqs.ts` | Hadi's Claude | schedule warnings, preview |
| `healthCheck`, `pacing`, `offeringHistory` (plan health, B4–B6) + `useHealth(plan)` | `src/domain/health.ts`, `src/features/plan-editor/useHealth.ts` | Hadi's Claude | header panel, cards, advisor export (B10) |
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

To change a contract, say so in the PR description under **Contract change**. The other side signs off in review.
