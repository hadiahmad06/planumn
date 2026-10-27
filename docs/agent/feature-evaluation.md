# v2 Feature Evaluation — judged, ideated, ranked

> Written by **Hadi's Claude** (Claude Code, Opus 5.5), 2026-10-26.
> Status: **proposal**. Every score is Hadi's Claude's estimate, not user research. Nothing here is decided until it's written into `docs/human/`.
> Builds on `2025-feature-inventory.md`. Row IDs: `E*` = existing 2025 feature, `N*` = new idea.

## Direction Hadi gave in chat (2026-10-26)

- AI chatbot: "probably pointless."
- APAS injection: "VERY USEFUL."
- "Be more creative."

These are Hadi's opinions as stated. Neither is a plan yet, so they're recorded here and not in `docs/human/`.

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

> Assumption to verify: the 2026 state of MyU's Graduation Planner and APAS UI. If UMN shipped a good planner since 2025, this positioning changes.

---

## Metrics

| Metric | Scale | Meaning |
|---|---|---|
| **D**emand | 1–5 | How many UMN students would use it, and how much they care (counts ×2) |
| **Diff**erentiation | 1–5 | How much it beats what students already have (APAS, Schedule Builder, GopherGrades, ChatGPT) |
| **C**onfidence | 1–5 | How sure we are we can build it *correctly* (data availability, parsing risk, edge cases) |
| **Lev**erage | 0–5 | How many other features it unlocks |
| **E**ffort | S/M/L/XL | Subtracted as 0 / 1 / 2 / 3 |
| Data risk | Low/Med/High | Dependence on unofficial, scraped or stale data |
| Retention | ✓ | Gives students a reason to come back every term |

**Score = 2·D + Diff + C + Lev − E** (maximum 25). This gives a starting order, not a final ranking. Hadi and Michael should override it freely.

---

## Foundations (not ranked; the product doesn't exist without them)

Semester grid with drag-and-drop (E4) · basic course search (E1) · cloud autosave + My Plans list with rename/delete/recover (E10, E12) · sign-in (recommend **UMN Google sign-in**, since umn.edu accounts are Google, instead of 2025's email/password) · undo/redo · landing/privacy pages (E20).

---

## Ranked features

| # | ID | Feature | D | Diff | C | Lev | E | Score | Data risk | Ret. | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | N1 | **APAS import**: pull your completed, in-progress, transfer/AP courses, catalog year, declared programs and per-requirement status from your APAS report | 5 | 5 | 3 | 5 | M | **22** | Med | ✓ | **MVP** |
| 2 | N19 | **Plan health check**: one panel listing every problem (prereq out of order, course not offered that term, over the credit cap, missing Lib Ed/WI, under 120 credits) | 5 | 5 | 3 | 3 | M | **20** | Med | ✓ | **MVP** |
| 3 | E15 | Requirement progress: x/y per requirement plus an overall "requirements met" widget (2025 evaluator, reworked) | 5 | 4 | 3 | 5 | L | **20** | High | ✓ | **MVP** |
| 4 | E2 | Grade distributions in the course preview | 5 | 3 | 5 | 2 | S | **20** | Low* | | **MVP** |
| 5 | N6 | **Lib Ed + Writing Intensive tracker**, auto-filled from course tags, following the student's catalog year | 5 | 4 | 4 | 2 | M | **19** | Low | ✓ | **MVP** |
| 6 | N7 | **Smart search filters**: by Lib Ed theme, "satisfies requirement X", offering term, credits, level, average GPA, no prereqs | 5 | 4 | 4 | 2 | M | **19** | Low | | **MVP** |
| 7 | N2 | **Offering-term warnings**: "CSCI 4061 has historically been Fall only" (inferred from term grade data) | 4 | 5 | 4 | 2 | S | **19** | Med* | | **MVP** |
| 8 | N25 | **Placeholder courses**: drop in "any 3xxx CSCI elective" or "Lib Ed: Global Perspectives" before you know the exact course | 4 | 4 | 4 | 3 | S | **19** | Low | | **MVP** |
| 9 | E18 | Prerequisite warnings on cards (2025 had this only inside the chatbot) | 5 | 4 | 3 | 3 | M | **19** | Med | | **MVP** |
| 10 | N5 | **Double-dip finder**: courses that satisfy a major requirement, a Lib Ed and/or a minor at once | 5 | 5 | 3 | 1 | M | **18** | Med | | Next |
| 11 | N16 | Professor insight in the preview: who usually teaches it, their grade distribution, RMP rating/difficulty | 5 | 3 | 4 | 1 | S | **18** | High (RMP) | | MVP (grades) / Next (RMP) |
| 12 | N3 | **Semester workload meter**: credits plus historical GPA, SRT and RMP difficulty → "this semester looks heavy" | 4 | 5 | 4 | 1 | S | **18** | Low | | **MVP** |
| 13 | E16 | Drag a course from a requirement row into a semester | 4 | 4 | 4 | 1 | S | **17** | — | | **MVP** |
| 14 | N9 | **Graduation pacing**: credits toward 120, projected graduation term, "add 1 credit and it's free" (banded-tuition hint, *verify current UMN tuition policy*) | 4 | 4 | 4 | 1 | S | **17** | Low | ✓ | **MVP** |
| 15 | N10 | **Advisor-ready export**: a one-page PDF/print of the plan with requirement status, to bring to advising | 4 | 3 | 5 | 1 | S | **17** | — | | **MVP** |
| 16 | N4 | **Minor / certificate finder**: "you're 2 courses from a Math minor" | 5 | 5 | 3 | 1 | L | **17** | High | | Next |
| 17 | N15 | What-if plans: duplicate a plan, switch programs, compare two plans side by side ("a double major costs +14 credits") | 4 | 4 | 4 | 1 | M | **16** | Med | | Next |
| 18 | E21 | Sharing: read-only link and "copy to my plans" | 4 | 3 | 4 | 2 | M | **16** | — | | Next |
| 19 | E13 | Transcript PDF import (2025) | 4 | 3 | 4 | 2 | M | 16 | Low | | **Merge into N1** (fallback only) |
| 20 | N11 | **Registration handoff**: turn next semester into a ready-to-register list with links to Schedule Builder / Class Search | 4 | 4 | 3 | 1 | M | **15** | Med | ✓ | Next |
| 21 | E11 | Try without an account (local autosave, 2025) | 4 | 2 | 4 | 1 | M | **14** | — | | Next |
| 22 | N13 | Start from a department's published 4-year sample plan | 4 | 3 | 3 | 1 | M | **14** | Med | | Next |
| 23 | N14 | Community insight: "CS majors usually take X in sophomore fall" (anonymized, from Planumn plans) | 4 | 5 | 2 | 1 | L | **14** | — (cold start) | | Later |
| 24 | E19 | Mobile: view the plan + tap-to-add | 4 | 2 | 4 | 0 | M | **13** | — | | Next |
| 25 | N12 | AP / IB / CLEP / transfer credit entry for students APAS doesn't cover yet | 3 | 3 | 4 | 1 | M | **13** | Med | | Next |
| 26 | E23 | Autofill: generate the remaining semesters toward requirements | 4 | 5 | 1 | 2 | XL | **13** | High | | Later |
| 27 | N20 | Catalog-change alerts: a course in your plan was renumbered or retired, or requirements changed; nudge to re-sync APAS each term | 3 | 4 | 3 | 1 | M | **12** | Med | ✓ | Later |
| 28 | N8 | Prerequisite "unlocks" graph and critical path to graduation | 3 | 4 | 3 | 1 | M | **12** | Med | | Later |
| 29 | N24 | Special semesters: study abroad, co-op, leave of absence (placeholder credits) | 2 | 3 | 5 | 0 | S | **12** | — | | Next (cheap) |
| 30 | E6 | Right-click / keyboard course actions (move season/year, copy code, open in catalog) | 3 | 1 | 5 | 0 | S | **12** | — | | Next (cheap) |
| 31 | E3 | Multi-panel course compare (2025 floating panels) | 3 | 3 | 4 | 0 | M | **12** | — | | Rework: simple side-by-side compare |
| 32 | E22 | Dark mode | 3 | 1 | 5 | 0 | S | **12** | — | | Next (only cheap if design tokens exist from day 1) |
| 33 | N22 | Friends: see which friends planned the same course in the same term | 3 | 4 | 3 | 0 | M | **11** | — (privacy) | | Later |
| 34 | N17 | Admission-to-major checklists (CSE upper-division, Carlson, Nursing, pre-health tracks) | 3 | 4 | 2 | 1 | L | **11** | High | | Later |
| 35 | N21 | Natural-language search: "easy Global Perspectives course in fall, no prereqs" | 3 | 3 | 3 | 0 | M | **10** | — | | Later |
| 36 | E5 | Layout toggles (transpose, year accordions, semester selection) | 2 | 1 | 5 | 0 | S | 10 | — | | **Rework**: keep only "hide summers" |
| 37 | E7 | Color cards by department/level | 2 | 1 | 5 | 0 | S | 10 | — | | **Rework**: color by which requirement a course satisfies |
| 38 | E24 | Cmd/Ctrl+K search | 2 | 1 | 5 | 0 | S | 10 | — | | Later (cheap polish) |
| 39 | N23 | Standalone browser extension that shows Planumn data inside MyU | 2 | 2 | 3 | 0 | M | 8 | — | | **Cut** (GopherGrades already does this). Keep only as an APAS-import route (see N1) |
| 40 | E17 | AI Advisor chatbot | 2 | 1 | 2 | 0 | M | **6** | — | | **Cut** |

\* Grade and term data in the 2025 database covers **Spring 2017 – Fall 2024** (23 terms, 9,731 courses, 10,495 professors with RMP fields). v2 needs a refresh pipeline, or these features go stale.

---

## Deep dive: APAS import (#1)

**Why it's #1:** it turns onboarding from "drag in 3 years of history" into a 10-second import. It makes requirement status *correct*, because it comes from UMN's own engine and already includes exceptions, substitutions, transfer/AP credit and the right catalog year. It also gives students a reason to come back every term (re-import after grades post). Seven other features on this list get better or easier once it exists.

**What we'd extract:** completed courses (term, grade, credits) · in-progress courses · transfer/AP/test credit · catalog year · declared programs · each requirement's status (complete / in progress / not met) and what's still needed.

**Ways in (ranked by effort):**
1. **Upload the APAS PDF** from MyU. *Verify the PDF has real text and isn't a scanned image.*
2. **Paste the report's text** (select all on the APAS page, copy, paste into Planumn). Most robust against layout changes.
3. **Browser-extension button** on the APAS page that sends the report to Planumn in one click. Best UX, most effort, needs Chrome Web Store review.

**Then also:** import a **What-If APAS** report to explore another major using UMN's own engine instead of our own rule parser.

**Privacy (decide early):** parse in the browser and store only courses and requirement status. Drop name, student ID and GPA unless the student opts in. Say so on the import screen, because trust is the adoption risk.

**Main technical risk:** APAS tells you the status of *completed* work. To show "after your planned semesters, what's left," we still have to evaluate *future* planned courses against the rules. Approach: APAS status for the past, the rule evaluator (2025 `AI_Advisor` evaluator, or CourseDog rules) for the future, and clearly mark which is which.

**Blocker:** we need **3–5 real APAS reports from different colleges** (CSE, CLA, Carlson, CBS) to build and test the parser. Hadi's and Michael's own reports are the obvious start.

---

## On the AI chatbot (#40)

Hadi's Claude agrees with cutting it as a headline feature:
- Students already have ChatGPT/Claude. A built-in chat adds little.
- A wrong answer about graduation requirements does real harm, and the 2025 advisor couldn't see requirements at all.
- It costs money per message, and it was read-only anyway.

**Where AI still earns its place, out of sight:** turning messy CourseDog/APAS requirement text into structured rules (run offline, reviewed by a human) and natural-language search (#35). Neither one is a chatbot.

---

## Proposed v2 MVP story (for discussion)

> **Import your APAS → see what you've done and what's left → plan the remaining semesters with live warnings → bring a one-page export to your advisor.**

MVP set (Hadi's Claude's proposal): Foundations + #1–9, #11 (grades part), #12–15.
Biggest risk: requirement correctness (#1, #3, #9). Cheapest standouts: offering-term warnings (#7), workload meter (#12), pacing (#14), advisor export (#15). These use data the 2025 database already has.

---

## Validate before committing (cheap)

1. **Check the 2025 Vercel Analytics for planu.mn.** Which pages got used, and was there a spike around registration? That's real demand data we already own.
2. **Run a 3-question poll** in r/uofm and the UMN student Discords: "Which of these would you use?" with the top 10 rows above.
3. **Ask 2–3 academic advisors** what they wish students brought to appointments. This validates #15 and #1.
4. **Collect APAS reports** (see the blocker above).

## Questions for Hadi & Michael

1. Do you agree with the APAS-first MVP story, or should requirements still come from CourseDog first?
2. Can the RMP data be used? There's legal/ToS risk. Ship professor insight with GopherGrades data only?
3. Should "Try without an account" stay? It conflicts with APAS import, which works best tied to an account.
4. Which of the 40 rows is missing something you've personally wanted as a UMN student?
