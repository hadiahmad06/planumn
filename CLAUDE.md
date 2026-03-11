# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the `frontend/` directory:

```bash
cd frontend
npm install       # Install dependencies
npm run dev       # Start dev server with Turbopack at localhost:3000
npm run build     # Production build
npm run lint      # ESLint
```

There are no tests configured in this project.

## Architecture Overview

**planu.mn** is a graduation planner for University of Minnesota students. Users drag-and-drop courses into semester slots to build a multi-year plan.

### Stack

- **Next.js 15 App Router** — pages and API routes under `frontend/src/app/`
- **Mantine UI 8** — primary component library; TailwindCSS 4 for utility styling
- **SQLite** (`frontend/public/ProcessedData.db`, 36MB) — local course data and grade distributions sourced from GopherGrades
- **Supabase** — user auth (Supabase Auth) and cloud plan storage (PostgreSQL with RLS)
- **@hello-pangea/dnd** — drag-and-drop for semesters and courses

### State Management

Six React contexts wrap the app (see `frontend/src/contexts/`):

| Context | Purpose |
|---|---|
| `UserSessionContext` | Supabase session / authenticated user |
| `PlanContext` / `PlanProvider` | Central plan state, auto-save, change tracking |
| `PlanAuditProvider` | Tracks modifications for undo/audit |
| `DisplaySettingsContext` | Color mode, filters, UI preferences |
| `MobileContext` | Responsive/mobile detection |
| `PreviewContext` | Floating draggable course detail panels |

`PlanProvider` is the most important — it owns the current plan, detects changes by diffing semesters/title/programs, auto-saves to Supabase (up to 6 retries), and caches fetched course details to avoid redundant API calls.

### Data Flow

**Course lookup:** Browser → `/api/course/full` → SQLite (`classdistribution` table) → `CourseDetails`

**Search:** Browser → `/api/search` → SQLite FTS → ranked `CourseStub[]`

**Plan save:** `PlanProvider` detects change → `/api/plan` (upsert) → Supabase `plans` table

**Program requirements:** `/api/programs` → CourseDog external API → recursive `ReqRule`/`ReqCondition`/`ReqValue` parsing → accordion UI

### Key Types (`frontend/src/types/`)

- `CourseStub` — minimal course info for search results (id, dept_abbr, course_num)
- `CourseDetails` — full course data including grade distributions and credit range
- `PlannedCourse` — `CourseDetails` + lock type (`locked` | `unlocked` | `autofilled`)
- `Plan` — semesters of `PlannedCourse[]`, metadata (user_id, programs, timestamps)
- `ProgramDetails` — CourseDog curriculum requirements tree

### API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/course/full` | GET | Batch fetch course details by `id` or `courseGroupId` |
| `/api/course/stub` | GET | Fetch minimal course stubs |
| `/api/search` | GET | Full-text course search |
| `/api/plan` | POST | Upsert plan to Supabase |
| `/api/plan/query` | GET | Fetch a specific plan |
| `/api/plan/delete` | POST | Soft-delete a plan |
| `/api/plan/recover` | POST | Recover soft-deleted plan |
| `/api/programs` | POST | Fetch program requirements from CourseDog |
| `/api/parseTranscript` | POST | Parse uploaded PDF transcript |

### Component Structure

Components follow atomic design under `frontend/src/components/`:
- **atoms/** — single-purpose (CourseCard, PlanHeader, grade distribution charts)
- **molecules/** — compound (SearchBar, PlanRow, SettingsPanel, auth modals)
- **organisms/** — full sections (PlanDisplay for desktop, PlanDisplayMobile, SearchLayout, CoursePreviewPanel)

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Both are public keys safe for client-side use. Supabase RLS enforces authorization — users can only read/write their own plans. Authentication is enforced via `frontend/src/middleware.ts` on every request.

### Notes

- TypeScript strict mode is **disabled** (eslint also disables `no-unused-vars` and `@typescript-eslint/no-explicit-any`)
- The `data/scripts/` directory contains Python scripts used to build `ProcessedData.db` from GopherGrades data — not part of the running app
- The `archived/` directory contains old code — ignore it
- `frontend/public/ProcessedData.db` is a 36MB binary tracked in git; do not modify it directly
