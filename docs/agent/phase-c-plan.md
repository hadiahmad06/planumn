# Phase C: requirement accuracy

> Written by **Hadi's Claude**, 2026-10-27. Hadi approved this plan the same day ("Approved. Record the
> Phase C plan and start with C1."). Corrected by Hadi's Claude, 2026-10-27: C1's "course sets" are old course ids. Owner: Hadi's Claude (`src/domain/` requirements, `src/server/programs/`,
> `src/features/requirements/`). One PR per step, each reviewed by Michael's Codex or Ishaan's Claude.

## Why

Hadi (2026-10-27): "some of the requirements aren't met course by course". Electrical Engineering B.E.E.'s
breadth and depth technical electives list no courses, and CS's technical-elective credit counts aren't shown.

The data is in CourseDog; our normalizer drops it. Survey of 33 programs (760 rules), 2026-10-27:

| Cause | Example | Programs |
|---|---|---|
| `numberOf` rules ("complete N of these") read as an empty course list | EE "Breadth and Depth": `number: 4` areas, `restriction: 5` courses; all seven area lists are in the data | 4 |
| Rule `description` never read (only `notes`) | CS "must total 23 credits… 11 must have a CSCI designator"; EE "34 total… minimum of 22 from Core Department Electives", "up to 12 credits" | 33 have one; 23 have credit counts **only** there |
| Course patterns as `freeformText` | EE "additional 4xxx/5xxx EE courses… Excludes EE 4981H… Includes CSCI 4203" | 9 |
| Courses listed by their **old** CourseDog id (20 characters, `deprecatedCourseGroupId`) left unresolved | shown as "Other approved course" | 16 |
| Group credit totals not evaluated | CS Technical Electives count 0 toward progress (Phase Y question) | most programs with elective pools |

## Steps

| Step | What | Notes |
|---|---|---|
| **C0** | Coverage report: run the normalizer over every CourseDog program; count unhandled conditions, unresolved ids, prose-only credit rules. | Baseline for C1–C4. |
| **C1** | Stop dropping data: show each rule's `description`; support `numberOf` (areas + total courses, one course per area); resolve courses listed by their old CourseDog id. | Low inference. The 20-character ids looked like shared "course sets" in the survey; #80 showed they are old course ids (`courses/search/$filters?courseGroupIds=` returns `deprecatedCourseGroupId`). Shipped as #79 (C1) and #80 (C1c). |
| **C2** | Credit constraints: group totals, per-list caps ("up to 12"), list minimums ("at least 22 core"), department minimums ("11 CSCI"). Structured fields first; prose read by documented phrase patterns, labelled "read from catalog text", plus per-program overrides where parsing fails. | Hadi decides whether prose-derived constraints count toward progress or are shown only (recommended: shown first, counted after C4 agrees). Settles the Phase Y 0-unit question. |
| **C3** | Pattern rules ("EE 4xxx/5xxx, excluding X, including Y") become checkable; the rail offers "any EE 4xxx/5xxx" linking to filtered search. | Labelled as inferred by planu.mn; rows in `heuristics.md`. |
| **C4** | Validate against APAS (parser from #71): fixture tests; local comparison on Hadi's real reports (never committed); show "APAS says: …" next to planu.mn's estimate when an audit is imported. | Also covers the APAS mismatches Hadi parked for Phase Y. |

## Other phases (reordered 2026-10-27)

- **B1 APAS**: finish #70–#72 (review fixes pushed), then multi-audit import after #71. What-if APAS from a plan is on hold until UMN enables the uAchieve Planner or "What If Courses" (Hadi is contacting UMN).
- **Phase B, remaining**: B21 catalog-change alerts (Ishaan's Claude); B23 and B25 blocked on Hadi's decisions.
- **Phase Y additions**: APAS import mismatches; the what-if/planner question for UMN; policy check for automation.
- **Phase X / Z**: unchanged.
