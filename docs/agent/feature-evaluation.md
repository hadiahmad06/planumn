# v2 Feature Evaluation — judged, ideated, ordered for implementation

> Written by **Hadi's Claude** (Claude Code, Opus 5.5), 2026-10-26. Revised the same day to follow Hadi's sequencing.
> Status: **proposal**, except the phase order, which Hadi decided (`docs/human/roadmap.md`). Every score is Hadi's Claude's estimate, not user research.
> Builds on `2025-feature-inventory.md`. Row IDs: `E*` = 2025 feature, `N*` = new idea from 2026-10-26.

## Direction Hadi gave in chat (2026-10-26)

- AI chatbot: "probably pointless."
- APAS injection: "VERY USEFUL."
- "Be more creative."
- **Decided:** "first we want to implement features that we had already partially or successfully implemented in our 2025 version. THEN we can move onto new features that were added today." → `docs/human/roadmap.md`

---

## What UMN students actually want (hypotheses)

| When | The question in the student's head | What answers it today |
|---|---|---|
| Any time | "Am I on track to graduate on time?" | APAS: authoritative, but hard to read and only covers your *declared* programs |
| Registration (Oct–Nov, Mar–Apr) | "What should I take next semester?" | Schedule Builder (one term only), Reddit, friends |
| Picking a course | "Which course, term and professor is least painful?" | GopherGrades (umn.lol), RateMyProfessors |
| Exploring | "Can I add a minor or switch majors without graduating late?" | What-If APAS (clunky), advisors |
| Before advising | "What do I bring to my advisor?" | A screenshot, or nothing |
| Freshman / transfer | "Where do my AP and transfer credits land?" | Admissions equivalency tables, then APAS once posted |

**Where Planumn fits:** the official tools are each authoritative about one thing (APAS = audit, Schedule Builder = one term, MyU Graduation Planner = an official but clunky plan). Students don't hate any single tool. They hate gluing them together. **Planumn v2 should be the place where your real record (APAS), the catalog, grade data and requirements meet on one multi-year canvas.**

> Assumption to verify: the 2026 state of MyU's Graduation Planner and APAS UI.

---

## Metrics (reference only; the order below follows dependencies, not score)

| Metric | Scale | Meaning |
|---|---|---|
| **D**emand | 1–5 | How many UMN students would use it, and how much they care (counts ×2) |
| **Diff**erentiation | 1–5 | How much it beats what students already have |
| **C**onfidence | 1–5 | How sure we are we can build it *correctly* |
| **Lev**erage | 0–5 | How many other features it unlocks |
| **E**ffort | S/M/L/XL | Subtracted as 0 / 1 / 2 / 3 |

**Score = 2·D + Diff + C + Lev − E** (max 25). "—" means foundation (not scored: the product doesn't work without it).

---

## Phase A — rebuild what 2025 already had (Live, Branch or Partial)

Ordered so each row only depends on rows above it. "2025" = how far it got in the 2025 code.

| Order | ID | Feature | 2025 | Depends on | Score | v2 note |
|---|---|---|---|---|---|---|
| **A1** | | **Catalog & data** | | | | |
| 1 | E-data | Course database: catalog, grade distributions (course/term/professor/dept), Lib Ed tags, SRT, OneStop, CourseDog `courseGroupId` | Live | — | — | Data stops at Fall 2024. Needs a refresh. |
| 2 | E1 | Course search by dept, number, title (honors "H") | Live | 1 | — | |
| 3 | E8.5 | Design language (cream/maroon, one set of design tokens) | Partial | — | — | Do it before any UI, so nothing gets styled twice (2026 PRD lesson) |
| **A2** | | **Plan canvas** | | | | |
| 4 | E4 | Semester grid (default 4 years from this Fall); drag courses in, between, reorder; remove | Live | 1, 3 | — | |
| 5 | E3.4 | Per-semester credit totals | Live | 4 | — | Drop the 2025 "credit ruler" (2026 PRD) |
| 6 | E3.7/3.13 | Add/remove semesters and years, `+` next semester, auto-add Summer after Spring | Branch / Partial | 4 | — | |
| 7 | E3.6 | Editable plan title | Live | 4 | — | |
| 8 | E3.14 | Lock state per course (`locked` / `unlocked` / `autofilled`) | Live (type) | 4 | — | Needed before transcript import (#20) |
| 9 | E3.16 / E7 | Course card: credit-height, colored stripe, color by dept/level | Partial / Live | 4 | 10 | Rework idea: color by requirement satisfied (after #26) |
| 10 | E5 | Hide seasons (e.g. hide all Summers) | Branch | 4 | 10 | **Rework:** keep this; decide on #30 |
| 11 | E2 | Course preview: click = persistent panel, hover = temporary; code, title, credits, description, grade charts | Live | 1, 4 | **20** | |
| 12 | E3 | Multiple preview panels for comparing | Live | 11 | 12 | Rework idea: simple side-by-side compare |
| 13 | E1.8/1.9 | Search results as course cards; top-bar search dropdown, drag from results | Branch / Partial | 2, 4 | — | |
| **A3** | | **Accounts & persistence** | | | | |
| 14 | E4.1 | Sign up / log in | Live | — | — | 2025 = email/password. **Open:** switch to UMN Google sign-in? |
| 15 | E4.2 | Profile dropdown + Settings modal | Live | 14 | — | |
| 16 | E10 | Cloud autosave on every change + "Saved 2 min ago" | Live / Partial | 4, 14 | — | |
| 17 | E11 | Signed-out mode: local autosave, resume, "overwrite autosave?" prompt | Live | 4 | 14 | |
| 18 | E12 | My Plans: list (course/credit counts), rename, soft delete (30 days) + recover, permanent delete, clear deleted | Live / Branch | 16 | — | |
| 19 | E4.10 | Plan loading states: skeleton, unauthorized, no access, unknown error | Live / Branch | 16 | — | |
| 20 | E13 | Transcript PDF import → new plan (past courses locked) | Live | 8, 16 | 16 | APAS import (#B1) may replace it later |
| 21 | E4.13 | Delete account ("Danger zone") | Partial? | 14 | — | Not confirmed working in 2025 |
| **A4** | | **Programs & requirements** | | | | |
| 22 | E5.1 | Pick programs (majors/minors, several per plan) + program switcher | Branch | 16 | — | |
| 23 | E5.2 | Fetch program requirements from UMN's CourseDog catalog | Branch | 22 | — | Unofficial API: high data risk |
| 24 | E5.3/5.4 | Requirements display: accordions, nested rules ("all of", "any N of", "N credits of"), clean vs structured modes | Branch / Partial | 23 | — | |
| 25 | E15 | Requirement evaluator: x/y per requirement, badges, pattern matches ("any 3000+ CSCI"), one course counting for several | Branch | 24 | **20** | 2026 `AI_Advisor` version has tests |
| 26 | E5.8 | Overall progress widget ("13/25 met", each course counted once) | Branch | 25 | (in 25) | |
| 27 | E5.10 / E16 | Requirements rail as the left-hand main surface; drag from a requirement into a semester | Partial / Branch | 24, 4 | 17 | |
| 28 | E5.11 | Filter/search requirements; highlight alternative courses | Branch | 24 | — | |
| 29 | E18 | Prerequisite checking | Branch | 1, 4 | 19 | 2025 = only the chatbot used it. v2: warnings on cards |
| **A5** | | **Editing polish & mobile** | | | | |
| 30 | E5 | Transpose layout, year expand/collapse, semester selection | Branch | 4 | 10 | **Decide:** keep, or drop in favor of #10 only |
| 31 | E6 | Right-click course menu: move season/year, delete, copy code, open in catalog | Partial | 4 | 12 | Add keyboard equivalents |
| 32 | E19 | Mobile layout, collapsible requirements, tap-to-add picker | Live / Partial | 4, 27 | 13 | |
| **A6** | | **Site** | | | | |
| 33 | E20 | Landing page (hero, demo video, signed-in vs out), contact, privacy, OG image/logo, analytics | Live | 3 | — | |
| **Z** | | **Phase Z — backburner (Hadi, 2026-10-26)** | | | | |
| 34 | E17 | AI Advisor chatbot (OpenRouter, tools: search, details, plan info, prereqs) | Branch | 1, 16, 29 | **6** | **Moved to Phase Z (backburner)** by Hadi, 2026-10-26 |

---

## Phase B — new features (2026-10-26) and 2025 ideas that were never built

Ordered by dependency first, then score. Starts once Phase A is done.

| Order | ID | Feature | Origin | Depends on | Score | Note |
|---|---|---|---|---|---|---|
| 1 | N1 | **APAS import**: completed, in-progress and transfer/AP courses; catalog year; declared programs; per-requirement status | New | A8, A16, A25 | **22** | Hadi: "VERY USEFUL." See deep dive. Can supersede A20. |
| 2 | N25 | Placeholder courses ("any 3xxx CSCI elective", "Lib Ed: Global Perspectives") | New | A4, A25 | 19 | |
| 3 | N6 | Lib Ed + Writing Intensive tracker (follows the student's catalog year) | New | A1, A25, B1 | 19 | Tag data already exists |
| 4 | N2 | Offering-term warnings ("historically Fall only") | New | A1, A4 | 19 | Inferred from 23 terms of grade data |
| 5 | N9 | Graduation pacing: credits toward 120, projected grad term, banded-tuition hint | New | A5 | 17 | Verify the current tuition policy |
| 6 | N19 | **Plan health check**: one panel for prereq order, offering term, credit cap, Lib Ed/WI gaps, under 120 credits | New | A29, B3, B4, B5 | 20 | Pulls together the rows above it |
| 7 | N3 | Semester workload meter (credits + historical GPA + SRT + RMP difficulty) | New | A1, A5 | 18 | |
| 8 | N7 | Smart search filters: Lib Ed theme, "satisfies requirement X", offering term, credits, level, avg GPA, no prereqs | New | A2, A25, B4 | 19 | |
| 9 | N16 | Professor insight in the preview: usual instructors, their grades, RMP | New | A11 | 18 | RMP has ToS risk: grades first, RMP later |
| 10 | N10 | Advisor-ready one-page PDF export | New | A26, B6 | 17 | |
| 11 | E3.5 / E3.17 | Lock toggle in the preview; "elective" badge on cards | 2025 idea | A8, A11, A25 | — | Lock may become "completed / in progress / planned" from APAS |
| 12 | N5 | Double-dip finder (major + Lib Ed + minor at once) | New | A25, B3 | 18 | |
| 13 | N15 | What-if plans: duplicate, switch programs, compare two plans | New | A18, A22 | 16 | What-If APAS import fits here |
| 14 | N4 | Minor / certificate finder ("2 courses from a Math minor") | New | A25, B1 | 17 | Needs requirements for every minor |
| 15 | E21 | Sharing: read-only link + "copy to my plans" | 2025 idea | A18 | 16 | |
| 16 | N11 | Registration handoff: next semester → list with Schedule Builder / Class Search links | New | A4 | 15 | |
| 17 | N13 | Start from a department's 4-year sample plan | New | A4, A22 | 14 | |
| 18 | N12 | AP / IB / CLEP / transfer credit entry | New | A4 | 13 | For students APAS doesn't cover yet |
| 19 | N24 | Special semesters (study abroad, co-op, leave) | New | A6 | 12 | Cheap |
| 20 | E22 / E24 | Dark mode; Cmd/Ctrl+K search | 2025 idea | A3 / A13 | 12 / 10 | Cheap if design tokens exist |
| 21 | N20 | Catalog-change alerts + "re-sync your APAS" each term | New | B1 | 12 | Brings students back each term |
| 22 | N8 | Prerequisite "unlocks" graph / critical path | New | A29 | 12 | |
| 23 | N14 | Community insight ("CS majors usually take X sophomore fall") | New | A18 (needs users) | 14 | Needs enough users first |
| 24 | E23 | Autofill the remaining semesters | 2025 idea | A25, A29, B4 | 13 | Hardest item on the list |
| 25 | N22 | Friends: who's taking the same course in the same term | New | A14, E21 | 11 | Privacy design needed |
| 26 | N17 | Admission-to-major checklists (CSE, Carlson, Nursing, pre-health) | New | A25 | 11 | |
| 27 | N21 | Natural-language course search | New | B8 | 10 | The useful form of AI |
| — | N23 | Standalone browser extension | New | — | 8 | **Cut.** GopherGrades already has one. Kept only as an APAS-import route |

---

## Deep dive: APAS import (B1)

**Why it matters:** it turns onboarding from "drag in 3 years of history" into a 10-second import. It makes requirement status *correct*, because it comes from UMN's own engine and already includes exceptions, substitutions, transfer/AP credit and the right catalog year. It also gives students a reason to come back every term.

**What we'd extract:** completed courses (term, grade, credits) · in-progress courses · transfer/AP/test credit · catalog year · declared programs · each requirement's status and what's still needed.

**Ways in (ranked by effort):**
1. **Upload the APAS PDF** from MyU. *Verify the PDF has real text and isn't a scanned image.*
2. **Paste the report's text** from the APAS page. Most robust against layout changes.
3. **Browser-extension button** on the APAS page. Best UX, most effort.

**Also:** import a **What-If APAS** report to explore another major using UMN's own engine.

**Privacy:** parse in the browser and store only courses and requirement status. Drop name, student ID and GPA unless the student opts in.

**Main technical risk:** APAS only judges *completed* work. Future planned courses still need the rule evaluator (A25). Mark clearly which status came from APAS and which from Planumn.

**Blocker:** 3–5 real APAS reports from different colleges (CSE, CLA, Carlson, CBS). Collect them during Phase A so B1 can start right away.

## On the AI chatbot (A34)

Hadi's Claude recommends cutting it, even though it was built in 2025: students already have ChatGPT, wrong requirement answers do real harm, and it costs money per message. AI is still useful out of sight, for parsing requirement text into rules and for natural-language search (B27).

---

## Validate (cheap, can run during Phase A)

1. Check the 2025 Vercel Analytics for planu.mn: which pages were used, and whether there was a registration-season spike.
2. Run a 3-question poll in r/uofm and the UMN Discords, using the top Phase B rows.
3. Ask 2–3 academic advisors what they want students to bring (validates B1, B10).
4. Collect APAS reports.

## Open questions for Hadi & Michael

1. A14: keep email/password, or switch to UMN Google sign-in?
2. A30: keep transpose / year collapse / semester selection, or only "hide summers"?
3. A34: cut the AI chatbot from Phase A?
4. Can RMP data be used (B9)?
5. A17 (signed-out mode) vs. B1 (APAS works best with an account): keep both?
