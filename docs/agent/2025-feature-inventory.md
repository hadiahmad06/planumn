# Planumn 2025 — Feature Inventory

> Written by **Hadi's Claude** (Claude Code, Opus 5.5), 2026-10-26.
> Source: a read of every branch on `origin` as of 2026-10-26. This lists features only, not methodology or stack.
> This is a description of what *existed*. It does not decide what v2 will have. Decisions belong in `docs/human/`.

## Branch map (2025 codebase)

Every branch forks from `main` (`86288c3`, 2025-06-25). Three lines diverge after `b20bef6` (2025-07-13):

| Branch | Last commit | Author | What it adds over `main` |
|---|---|---|---|
| `main` | 2025-06-25 | both | What's live in production at planu.mn |
| `dev` | 2025-07-13 | Hadi + Michael | Plan-list management, semester hiding/transposing, loading/error prompts, requirements accordion (first pass) |
| `parse_program_data` | 2026-03-11 | Hadi (glm-4.7) | Requirement completion checking, progress dashboard, drag from requirements, course-card context menu, semester selection, year expand/collapse |
| **`AI_Advisor`** (newest) | 2026-05-20 | Michael | AI Advisor chat, requirement evaluator + global progress (with tests), partial "redesign-v1" (rail / top bar / mobile picker), PRD + ADRs |
| `settings` | 2025-06-12 | Michael | Add/delete leftmost/rightmost year (not merged; accidentally commits `node_modules`) |
| `Reverse_Engineer`, `ui`, `Small_UI_fixes` | ≤ 2025-07-12 | — | Fully contained in `dev` |
| `auth`, `gophergraph`, `mantine`, `plans-db`, `semesterUI`, `supabase`, `scrolling`, `test` | ≤ 2025-06-21 | — | Fully merged into `main` |

Status legend: **Live** = on `main`/production · **Branch** = built on a branch, never shipped · **Partial** = started, incomplete · **Planned** = only exists in docs (PRD / roadmap / issue files).

---

## 1. Course data & catalog

| # | Feature | Status | Where |
|---|---|---|---|
| 1.1 | UMN Twin Cities course database: dept, number, title, description, min/max credits, campus | Live | `main` |
| 1.2 | Historical grade distributions per course (from GopherGrades), plus per-term, per-professor and per-department tables | Live | `main` |
| 1.3 | Liberal Education (Lib Ed) attribute associations per course | Live (data only) | `main` (`libed`, `libedAssociationTable`) |
| 1.4 | Student Rating of Teaching (SRT) values per course | Live (data) | `main` |
| 1.5 | OneStop link and description per course | Live (data) | `main` |
| 1.6 | CourseDog `courseGroupId` mapping, so courses can be fetched by either id | Branch | `dev`, `AI_Advisor` |
| 1.7 | Course search by dept, number and title ("csci 2041", "2041", honors "H"), ranked, 100 results max | Live | `main` |
| 1.8 | Search results shown as course cards | Branch | `dev`+ |
| 1.9 | Top-bar search dropdown (replaces the persistent search panel), drag from results | Partial | `AI_Advisor` |
| 1.10 | Cmd/Ctrl+K opens search | Planned | `AI_Advisor` issue 12 |

## 2. Course preview

| # | Feature | Status | Where |
|---|---|---|---|
| 2.1 | Click a course to open a persistent floating preview panel | Live | `main` |
| 2.2 | Hovering a course shows a temporary preview | Live | `main` |
| 2.3 | Several preview panels open at once, draggable, kept on-screen, click to bring to front (for comparing courses) | Live | `main` |
| 2.4 | Preview content: code, title, credits, collapsible description, grade-distribution bar chart and area chart | Live | `main` |
| 2.5 | Lock state shown and toggled from the preview | Planned | `AI_Advisor` PRD |

## 3. Plan editing (the schedule)

| # | Feature | Status | Where |
|---|---|---|---|
| 3.1 | A plan is an ordered set of semesters (Fall/Spring/Summer). A new plan defaults to 4 years (12 semesters) starting this Fall | Live | `main` |
| 3.2 | Drag courses from search into a semester, between semesters, and reorder within one | Live | `main` |
| 3.3 | Remove a course from the plan | Live | `main` |
| 3.4 | Per-semester credit totals and a "credit ruler" | Live | `main` (the ruler is removed in the `AI_Advisor` PRD) |
| 3.5 | Color-code course cards by department, level or none | Live | `main` |
| 3.6 | Editable plan title | Live | `main` |
| 3.7 | Add or delete the leftmost/rightmost year | Branch | `settings` |
| 3.8 | Hide whole seasons (e.g. every Summer), managed in Settings | Branch | `dev`, `AI_Advisor` |
| 3.9 | Transpose the semester layout (rows ↔ columns) | Branch | `dev`, `AI_Advisor` |
| 3.10 | Semesters grouped by year in accordions or scroll areas | Branch | `dev` |
| 3.11 | Click semester headers to select them; expand/collapse a whole year | Branch | `parse_program_data` |
| 3.12 | Right-click a course: delete, move to Fall/Spring/Summer, move to previous/next year, copy code, open in catalog | Partial | `parse_program_data` (`ContextMenu.tsx` + roadmap doc) |
| 3.13 | Right-click a semester to remove it (asks first if it isn't empty); `+` button adds the next semester; an empty Summer is added automatically after each Spring | Partial | `AI_Advisor` |
| 3.14 | Per-course lock state (`locked` / `unlocked` / `autofilled`); courses from a transcript are locked | Live (type) / Planned (UI) | `main`, `AI_Advisor` |
| 3.15 | Autofill (the plan generates future semesters itself) | Planned (parked) | Only the `autofilled` lock type exists |
| 3.16 | Course card height scales with its credits; colored left stripe | Partial | `AI_Advisor` |
| 3.17 | Electives (courses that satisfy no requirement) get a small badge | Planned | `AI_Advisor` CONTEXT.md |

## 4. Plans, accounts and persistence

| # | Feature | Status | Where |
|---|---|---|---|
| 4.1 | Email/password sign-up and login (password rules, email-verification resend with a cooldown) | Live | `main` |
| 4.2 | Profile dropdown (Plans / Application / Account / Danger zone) and a Settings modal | Live → restyled | `main`, `AI_Advisor` |
| 4.3 | Signed-in users: cloud autosave on every change (change detection, retries) | Live | `main` |
| 4.4 | "Saved 2 minutes ago" status | Partial | `AI_Advisor` |
| 4.5 | Signed-out users: autosave to localStorage, `/plan/autosave` to resume, and an "overwrite autosave?" prompt | Live | `main` |
| 4.6 | My Plans page: list sorted by last updated, with course and credit counts per plan | Live | `main` |
| 4.7 | Rename a plan from the list | Branch | `dev` |
| 4.8 | Soft delete with a 30-day scheduled deletion (server time), recover, and show/hide deleted plans | Live | `main` |
| 4.9 | Permanent delete and "Clear deleted plans" / DELETE ALL | Branch | `dev` |
| 4.10 | Plan loading states: skeleton, plus prompts for unauthorized, no access and unknown error | Live (partial) / Branch | `main`, `dev` |
| 4.11 | Transcript import: upload a UMN unofficial transcript PDF, which is parsed into semesters and courses and becomes a new plan | Live | `main` |
| 4.12 | Plan sharing: the `can_view` field exists and the Share button says "coming soon" | Planned (deferred) | `AI_Advisor` PRD |
| 4.13 | Delete account ("Danger zone") | Partial | `main`/`AI_Advisor` — needs checking |

## 5. Programs & degree requirements (degree audit)

| # | Feature | Status | Where |
|---|---|---|---|
| 5.1 | Pick programs (majors and minors) for a plan; a plan can target several; program switcher in the plan header | Branch | `AI_Advisor` (`programOptions.json`) |
| 5.2 | Live program requirements fetched from the UMN CourseDog catalog API | Branch | `dev`, `parse_program_data`, `AI_Advisor` |
| 5.3 | Requirements shown as accordions with recursive rules ("complete all", "any N of", "N credits of"), sub-rules and notes | Branch | `dev`+ |
| 5.4 | Two render modes: a clean checklist for simple requirements and a structured tree for complex ones | Partial | `AI_Advisor` (ADR-0001) |
| 5.5 | Completion checking: x/y per requirement, completion badges (✓ / % / not started), completed courses highlighted | Branch | `parse_program_data`, `AI_Advisor` |
| 5.6 | Pattern matches ("any 3000+ CSCI"), shown as "applied via pattern" | Branch | `AI_Advisor` (evaluator + tests) |
| 5.7 | One course can satisfy several requirements, so every matching row checks | Branch | `AI_Advisor` |
| 5.8 | Global progress widget, e.g. "13/25 requirements met", counting each course once | Branch | `AI_Advisor` (ADR-0002, tests), `parse_program_data` (`ProgressDashboard`) |
| 5.9 | Drag a course straight from a requirement row into a semester | Branch | `parse_program_data`, `AI_Advisor` |
| 5.10 | Requirements become the left-hand "rail", the main surface of the plan view | Partial | `AI_Advisor` |
| 5.11 | Filter and search requirements; highlight alternative courses | Branch | `parse_program_data` |
| 5.12 | Prerequisite checking for a course in a target semester | Branch | `AI_Advisor` (used only by the advisor) |

## 6. AI Advisor

| # | Feature | Status | Where |
|---|---|---|---|
| 6.1 | Floating chat in the bottom-right of the plan view | Branch | `AI_Advisor` |
| 6.2 | LLM through OpenRouter, with a model picker | Branch | `AI_Advisor` |
| 6.3 | Advisor tools: search courses, get course details, read the student's plan (whole or one semester), check prerequisites | Branch | `AI_Advisor` |
| 6.4 | Read-only: the advisor can't modify the plan | Branch | `AI_Advisor` (system prompt) |
| 6.5 | Streamed replies, at most 5 tool iterations | Branch | `AI_Advisor` |

## 7. Mobile

| # | Feature | Status | Where |
|---|---|---|---|
| 7.1 | Separate mobile plan layout | Live | `main` |
| 7.2 | Collapsible requirements section above the semester stack | Partial | `AI_Advisor` |
| 7.3 | Tap to add ("Add to which semester?" picker) instead of touch-drag | Partial | `AI_Advisor` |

## 8. Marketing, info & site-wide

| # | Feature | Status | Where |
|---|---|---|---|
| 8.1 | Landing page: hero, animated typing, demo video popup, feature blurbs ("Live course data", "Past grade distributions", "Built by students"), different buttons when signed in vs out | Live | `main` |
| 8.2 | Contact page (team photos) and privacy page | Live | `main` |
| 8.3 | OG image, favicon, logo | Live | `main` |
| 8.4 | Usage analytics and speed insights | Live | `main` |
| 8.5 | Unified cream/maroon design language across every surface | Partial | `AI_Advisor` (redesign-v1 issues 01–12, "01–06 partial") |
| 8.6 | Dark mode | Planned (deferred) | `AI_Advisor` PRD |

---

## Planning docs left on branches (worth reading for intent)

- `AI_Advisor`: `.scratch/redesign-v1/PRD.md` (42 user stories), `issues/01–12`, `CONTEXT.md` (domain glossary), `docs/adr/0001–0004`, `docs/advisor-chat.mermaid`
- `parse_program_data`: `docs/ROADMAP.md`, `docs/PLAN-DISPLAY-ROADMAP.md`, `docs/COURSECARD-CONTEXT-MENU.md`, `docs/PROGRAM_REQUIREMENTS.md`, `docs/ME.md` (Hadi's note: "refactor all course data storage — ONE medium")

Read any file without checking it out: `git show origin/<branch>:<path>`.
