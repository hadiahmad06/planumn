# Heuristics and data workarounds

> Written by **Hadi's Claude**, 2026-10-27, at Hadi's request: "heuristics and quick fixes are dangerous … document them all and don't overly rely on them. Some UMN courses may not have accurate attributes such as prerequisites in CourseDog, but that's no excuse to not document what methodologies you use to work around them."
>
> **Rule for every agent:** any new threshold, inference or data workaround gets a row here **in the same PR**. Where it changes what a student sees, the UI must say so (label it "historical", "estimate" or "can't check", or give the reason). Rows that once said *open PR* are now all on `v2/main` (as of `ebc6407`).

Columns: **Rule** (what the code assumes) · **Why** · **How it fails** · **Shown to the student?** · **Where**.

## Plan comparison matching — Michael's Codex

> Written by **Michael's Codex**, 2026-10-27.

| Rule | Why | How it fails | Shown? | Where |
|---|---|---|---|---|
| Placeholder slots pair by **exact label, credits and CLE tag**, counting duplicates independently; unchanged shared keys pair first, and a remaining shared slot key pairs an edit. Prior-credit semesters align by `kind: prior`, regardless of their synthetic term date. | Independently created identical slots have different generated IDs, and the prior-credit storage date follows each plan's start. | Differently worded slots with the same intention remain unmatched. A slot is a planning intention, not evidence of an earned course or fulfilled requirement. | Yes: the comparison explains exact slot matching and prior-credit alignment, and shows placeholder contents, counts, and semester types. | `src/features/plans/compare.ts`, `PlanComparison.tsx` (B13 integration repair) |

## 1. Data sources and known quality problems

| Source | Used for | Known problems | Workaround |
|---|---|---|---|
| `data/catalog.db` (2025 GopherGrades build) | course ids, titles, credits, descriptions, grade counts, offered terms, SRT | Grade data **ends Fall 2024**. Lib Ed tags (`libed` tables) are **wrong**: other campuses' tags and wrong designations (ECON 1101 tagged Historical Perspectives, per #46). Prerequisites exist only as free text inside the description. | Lib Ed comes from CourseDog instead (below). Every grade- or term-based number says "historical" or "through Fall 2024". |
| CourseDog public API (UMN catalog) | program requirements, Lib Ed (`attributes` "CLE - XX"), course versions | One designation has **several spellings** ("CLE - DSJ (Race, Power, and Justice US)" vs "(Diversity and Soc Justice US)"). **Old versions** of a course keep designations the current one dropped. **Prerequisite and attribute data can be missing or wrong** for some courses. Requirements reference courses our catalog may not have (`courseId: null`). | Parse codes, not labels (`libEdCodes`). Pick the **version in effect today**, else the earliest future one (`fetchLibEdCodes`, `currentVersions`). Show courses missing from our data as "isn't in planu.mn's course data yet". Programs that still use a course's **old 20-character id** are resolved through CourseDog's `deprecatedCourseGroupId` (Phase C/C1c, Hadi's Claude). |
| CourseDog `customFields.cdSamplePlanLink` (B17) | "Sample four-year plan (UMN)" link per program, to `sampleplan.umn.edu` | HTML, not a URL. Missing for some majors (1 of 34 sampled; Geography has its link only in prose notes). Departments revise the plans on their own schedule. | Link only, never copied (Hadi, 2026-10-27). Only the first **https umn.edu** link is used; otherwise no link is shown. (Hadi's Claude) |
| Prerequisite text | prerequisite warnings, autofill order, "no prerequisites" filter | Free text, inconsistent: "Calc I (Math 1271 or …) as a corequisite", "CS upper div, CS grad, or dept. permission", "MATH [1271 OR 1371]". | See section 3. Anything that isn't a course code ("consent", "standing", "corequisite") is kept as "other" and **never blocks**. Warnings say "or other ways to qualify" when such text exists. |
| APAS page captured by the extension (B1) | the future APAS parser; quick "is this the report?" signals on `/plan/apas` | Unknown markup until real samples exist. Content inside `<iframe>`/`<frame>` isn't captured. | "N course codes found" counts strings shaped like **2–4 capital letters + 4 digits** in the visible text, including uAchieve's campus-prefixed, padded cells (`1EE  3101`) (false hits like "ABC 2026" possible; 0 if courses render by script later), and frames get a warning. Shown on `/plan/apas`; `captureChecks` in `src/features/apas/capture.ts`. (Hadi's Claude) |

## 2. Offering and grade inferences

| Rule | Why | How it fails | Shown? | Where |
|---|---|---|---|---|
| A course's offering pattern is "known" only with **≥ 3 recorded terms**. The seasons it ran in are its offered seasons. | Grade records are the only term history we have. | Records stop at Fall 2024. New or rotating courses look "never offered" in a season they now run in. Low enrollment can hide terms. | Yes: "Historically offered: …", "Not enough history to tell". | `offeringHistory` in `src/domain/health.ts` (B4) |
| Average GPA needs **≥ 20 letter grades**, using A=4 … F=0 (A-=3.667 etc.). S/N/P/W are ignored. | Small samples are noise. | Courses graded mostly S/N have no GPA. Old grading eras are mixed in. | GPA hidden under 20 grades. "No letter grades recorded" in charts. | `averageGpa` in `src/domain/workload.ts`. Same rule in `src/features/preview/instructor.ts` (B9, Michael's Codex) |
| A W share above **7.5%** shows the W bar in red. | 2025 card's rule. | It's a fixed threshold, not field-specific. | Only by color. | `GradeCharts.tsx` (#55) |
| **Workload meter:** effort = Σ credits × (1 + max(0, 3.3 − avg GPA)/1.3); **≥ 20 heavy, ≤ 13 light**. Courses without a GPA count at weight 1. | A rough signal from credits + grades (B7). | Grades don't measure effort. Constants are hand-picked. | Yes: the badge's tooltip calls it a rough signal from historical grades and gives the formula. | `semesterWorkload` in `src/domain/workload.ts` |
| Credit loads: **> 18** heavy ("usually need approval"); **< 12** in fall/spring is part-time; **120** credits is the graduation baseline. | Common UMN policy numbers. | College-specific caps differ, and some programs need more than 120. | Yes, as health messages. | `HEAVY_LOAD`, `FULL_TIME`, `GRADUATION_CREDITS` in `src/domain/health.ts` |
| Planned credits use a course's **minimum** credits. | Variable-credit courses have no single value. | 1–4 credit courses undercount. | Ranges shown on cards ("1–4 cr"). | audit, pacing, autofill |

## 3. Prerequisite parsing

| Rule | Why | How it fails | Shown? | Where |
|---|---|---|---|---|
| Codes are parsed into an and/or tree. A bare number inherits the last department ("CSCI 1913 or 1933"). A department written **before a bracket** applies inside it ("MATH [1271 OR 1371]"; fixed in #62). | Catalog text style. | Unusual punctuation can still misattribute departments. | No. **Gap:** we don't show the parsed tree. | `src/domain/prereqs.ts` |
| Non-course clauses ("consent", "standing", "corequisite", "or equivalent") never block. | We can't check them. | A real requirement (upper-division standing) is ignored. | Yes: "or other ways to qualify". | `checkPrereqs` |
| **Suffix equivalence:** `…H` / `…V` (honors) and `…W` (writing intensive) satisfy the base number ("PHYS 1301W" counts for "PHYS 1301"). (H: #57; V/W: #62.) | Prerequisites list base numbers. | A suffixed course that is genuinely different would wrongly count. | No. | `equivalentCodes` in `src/domain/course.ts` |
| A course is planned "before" only if it's in an **earlier semester** (not the same one). | Simple and conservative. | Corequisites taken together show a warning. | Yes, as a warning (not a block). | `usePrereqStatus` |

## 4. Requirements, electives, double-dips, minors

| Rule | Why | How it fails | Shown? | Where |
|---|---|---|---|---|
| **APAS parser (B1 step 2), course rows** (Hadi's Claude, from two real uAchieve 5.2 reports): condition `IP`, or a grading basis (`AF`, `SN`) as the grade = in progress; `FT` = planned; `W` = withdrawn; `T`/`T3`–`T5` = AP/IB/exam credit when a description line has "EXAM", else transfer; 0 credits = no credit. A course **attempt** (term + course + grade + condition) listed under APAS's own **"Courses That Do Not Earn Credit…"** earns no credit, whatever its grade; other attempts of the same course are unaffected (this catches the `NOTR 0T001` placeholder). Each course row is kept once (term + course + grade + condition). | The report has no "kind" column. APAS's own no-credit list beats our guesses. | A grade code we haven't seen falls back to "completed". The no-credit list is found by its title. | Yes: `/plan/apas` shows each course's "Counts as" and compares our earned and in-progress credit sums with APAS's "Minimum Degree Credits" totals (red if they differ). Both real sample reports matched APAS's totals. | `classifyApasCourse` in `src/domain/apas.ts`, `markNoCredit` in `src/features/apas/parseReport.ts` |
| **APAS parser, page structure:** the audit appears twice in the page (mobile and desktop copies); only `#selectedAudit #audit` is read (else the first `#audit`). Subjects are space-padded to 4 letters after the campus digit (`1EE  3101`). The student ID, name and advisors are never read. | Reading both copies doubles every course. | A uAchieve upgrade can change the markup; the parser then returns null or misses parts, and the credit check shows the gap. | Yes: "This page isn't an APAS audit report" when nothing is found. | `parseApasReport` |
| **APAS → plan** (Hadi's Claude): the plan runs from the first term with a UMN course (taken, registered or withdrawn) through APAS's expected graduation term (else 4 years), summers included. AP/IB/exam credit, and transfer credit dated before that first term, go into the **prior credit** semester; later transfer credit stays in its term. Every placed course is **locked**. Withdrawn, no-credit and failed rows are left out. Courses not in planu.mn's catalog become **placeholder slots** with APAS's credits (at most 20 per term; extras, and the same course twice in one term, are listed as left out). **Program:** APAS `1 PPPP SS DDD` ↔ CourseDog `PPPP DDD CC` (majors), `2 PPPP 00000` ↔ `PPPP MIN…` (minors), unique matches only. | APAS already decided what counts and when; the plan should mirror it. The program rule matched all 40 CSE degree programs on the APAS run page with no wrong match. | Placed catalog courses show the **catalog's** credits, which can differ from APAS (variable or transfer credit). Programs missing from our list, lower-division and honors programs map to nothing. A student who started elsewhere may want early transfer terms as real semesters. | Yes: before opening, `/plan/apas` lists the matched count, the program it mapped (or that none did), the term range, every placeholder and every left-out course with its reason. | `apasPlan`, `apasProgramId` in `src/domain/apasPlan.ts` |
| Requirements that count **0 units** (e.g. CS "Technical Electives (up to 22 credits)") don't count toward progress and are skipped by the double-dip finder and autofill. | Hadi hasn't decided yet: **Phase Y**. | Students may need those credits. | Rail shows them, and progress excludes them. **Gap:** not explained in the UI. | `evaluateRule`, `findDoubleDips`, `pickCourses` |
| **"Complete N of these" (CourseDog `numberOf`, Phase C/C1)**: children covered = a matching of planned courses to children, so a course listed in two (EE 4161W) covers one; the course total counts every planned course any child lists. Satisfied when both reach the catalog's `number` and `restriction`. Autofill completes children until N are covered but doesn't chase the course total. | EE's catalog note: "students can count a course in only one technical area". | A per-area minimum above one course (EE's "2 courses in a fourth area") isn't checked separately; the total stands in for it. | Yes: "2/4 areas · 3/5 courses" and "Complete 4 of these 7, 5 courses in all. A course counts in one of them only." | `evaluateNumberOf` in `src/domain/requirements.ts` (Hadi's Claude) |
| **Elective badge** = no plan program *lists* the course (not "matched"). Suffix-equivalent codes count as listed. | A surplus "pick N" course isn't an elective. | A course counting via a text rule or a petition still shows "Elective". | Tooltip explains. | `useIsElective` (B11) |
| Lib Ed **"covered"** = at least one planned course or slot carries it. Credit minimums, theme counts and the WI upper-division rule are not checked. | Those depend on admit term; APAS decides. | "Covered" ≠ "complete". | Yes: "This isn't an audit". | `libEdCoverage` (B3, Ishaan's Claude) |
| Double-dip candidates are only courses the plan's programs list. Lib Ed-only double-dips aren't searched. | Bounded candidate set. | Misses Lib Ed + Lib Ed courses outside programs. | Yes: "Check with your advisor that a course may count twice". | `src/domain/doubleDip.ts` (B12) |
| Minor ranking: most matched planned courses, then share of requirements, then name. | B14 (Ishaan's Claude). | Counts courses, not credits or rules. | Shown as counts. | `rankMinors` in `src/domain/minors.ts` |
| **Admission checklists (B26):** the list is CourseDog's own "Program Admission Requirements" level (`requirementLevel`), not a planu.mn list. "In plan" = **planned**, not passed. "Planned by" = the latest term holding a counted course (its first appearance); AP/IB/transfer shows as "prior credit". | Official data per major; no hand-written lists to go stale. | Grade minimums (C-), the technical GPA, deadlines and space-available admission can't be checked. Majors that describe admission courses only in prose (Nursing) get no checklist rows. **Pre-health isn't a major**, so it has no catalog data and no checklist. | Yes: "planned, not passed … can't check minimum grades, your GPA or application deadlines", plus the catalog text and its links as written. | `admissionChecklist` in `src/domain/admission.ts`, `AdmissionChecklist.tsx` |
| **Coverage report credit phrases (Phase C/C0):** a number of 1–2 digits (optionally a range, optionally "total") directly before "credit(s)"/"cr" counts as a credit count in prose. A rule is "prose-only" when such a phrase is in its `description`/`notes` and it has no `minCredits`/`maxCredits`/`credits` above 0. | Measures how much of each program lives only in catalog text, as C2's baseline. | Misses spelled-out numbers ("twelve credits") and phrases like "credits: 12"; counts mentions that aren't constraints ("each lab is 1 credit"). | No: developer report only (`docs/agent/requirement-coverage.md`), nothing students see. C2 will add its own rows for what the UI shows. | `creditPhrases` in `src/server/programs/coverage.ts` (Hadi's Claude) |

## 5. Search

| Rule | Why | How it fails | Shown? | Where |
|---|---|---|---|---|
| **"No prerequisites"** = the catalog description has no "prereq:" clause. | Only source. | Courses whose prerequisites are missing from the text (CourseDog gaps) pass the filter. | Yes: labeled "(per catalog text)", with a tooltip to check the catalog. | `courseFacts` in `src/server/catalog/facts.ts` (B8) |
| **"Offered in"** filter uses the ≥ 3-term rule. Unknown patterns are **excluded**. | Avoid false positives. | Hides new courses. | Partly ("Offered: any term"). | `matchesFilters` |
| Lib Ed filter uses the CourseDog index, read once (≤ 6 pages × 10,000 rows) and cached for days. Logs a warning if truncated. | One designation, several spellings. | Index can be stale for up to the cache lifetime. | No. | `fetchLibEdIndex` |
| **Natural-language search** (#61): phrase rules map to filters. **"easy" = avg GPA ≥ 3.50, "easiest" ≥ 3.75**, "intro" = 1xxx, "graduate" = 5xxx+. A department name or a ≥ 3-letter code word sets the department. Generic words ("global", "environment") alone stay title words. | Rule-based, no LLM. | "Easy" is a grade proxy, not difficulty. Odd phrasing is misread. | Yes: every reading is shown under the input ("Understood: …") and can be edited. | `src/domain/naturalQuery.ts` |

## 6. Moves and autofill

| Rule | Why | How it fails | Shown? | Where |
|---|---|---|---|---|
| **‹ › arrows** (#59) snap to the nearest term in the course's offered seasons. With an **unknown pattern, any season**. They stay inside the plan's first and last semester and skip hidden seasons, leave semesters and terms already holding the course. | Hadi's spec (fall-only stays fall). | Same limits as the offering rule. | Yes: "(offering pattern unknown)", "No later offered term in your plan". | `snapMove` in `src/domain/moveSnap.ts` |
| **Autofill** (#62) is a suggestion only; nothing changes until the student ticks and adds. The rules below apply. | Hardest item; must stay reviewable. | See each rule. | Yes: "How these are chosen (rules of thumb, not an audit)" in the dialog. | `src/domain/autofill.ts` |
| · Picks per unmet requirement, preferring courses already picked for another one. "Any of" takes the **first workable branch**. Unknown credits count as **3**. | Fewer courses overall. | First branch isn't necessarily best for the student. | Reasons listed per course. | `pickCourses` |
| · Only terms **after the one in progress**. Regular, abroad and co-op semesters only. Summers **only if ticked**. Default cap **15** credits. | Realistic default loads. | Some students take heavy loads or summers. | Cap and summer are user options. | `placeCourses` |
| · **3xxx+ courses aren't placed in the plan's first academic year.** | Many state "upper-division standing" as uncheckable text (CSCI 3081W). | Wrong for students with transfer or AP credit, or advanced first-years. | Yes: an optional checkbox (on by default) with its reason; held courses say "Held to year two: upper-division". | `placeCourses` |
| · In an "or" prerequisite that includes a planned or picked option, outside options are ignored. Prerequisites outside the plan **don't block**; they're noted ("Needs MATH 1272"). | Wait for the course the student is actually taking; don't hide suggestions. | A real missing prerequisite still lets a course be placed. | Yes: the "Needs …" note. | `prune`, `placeCourses` |
| · Greedy: earliest term that fits, prerequisite depth first, then course code. | Simple, explainable. | Not optimal balancing across terms. | No. | `placeCourses` |

## 7. Registration handoff

| Rule | Why | How it fails | Shown? | Where |
|---|---|---|---|---|
| "Hasn't historically run in this season" uses the offering rule. Only known-good URLs are linked (catalog URL from our data, `schedulebuilder.umn.edu`). | No guessed Class Search query formats. | Same as the offering rule. | Yes ("Check Class Search"). | `RegistrationDialog.tsx` (#63) |

## 8. APAS audit automation

> Added by **Hadi's Claude**, 2026-10-27 (Hadi's decision in `docs/human/roadmap.md`).

| Rule | Why | How it fails | Shown? | Where |
|---|---|---|---|---|
| The new audit is the first row on *View Previous APAS* whose id **wasn't there before** we clicked Run Declared Programs (ids noted first, so no clock comparison). Among several, a **degree program** is sent first (APAS code `1 PPPP SS DDD` with a non-zero degree part), so honors or lower-division audits aren't picked over the major. Only one audit is sent per import for now. | Declared programs produce several audits at once; the major is what a plan needs. | A student with two majors gets the first one listed. If another audit finishes in the same moment (e.g. run from a second tab), it could be picked. | Yes: the bar says each step, and the planu.mn page shows which program the report is for. | `pickNewAudit`, `isDegreeProgram` in `extension/src/automation.js` |
| The extension waits at most **4 minutes** for the audit, then falls back to the manual Send. It reloads the list every 15 s in case APAS stopped refreshing. | APAS usually finishes within a minute. | A slow APAS day times out early. | Yes: "APAS is taking longer than usual…". | `WAIT_MS`, `RELOAD_MS` |

## Open gaps to close

1. ~~Autofill must list its rules in the dialog.~~ Done in #62.
2. Explain 0-unit requirements in the rail (waits on Hadi's Phase Y decision).
3. ~~Label the "No prerequisites" filter as "per catalog text".~~ Done.
4. ~~Show the workload formula behind the meter.~~ Done (badge tooltip).
