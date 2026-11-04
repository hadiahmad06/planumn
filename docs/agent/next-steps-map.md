# Next steps: a brainstorm map

> Written by **Hadi's Claude** (next-steps brainstorm), 2026-11-04. A brainstorm for Hadi to choose from, not a plan he has approved.

Scope: broad functionality only. Bug fixes and polish stay in the backlog on #16. Decisions are in `docs/human/roadmap.md`; nothing here overrides it. Value, effort and blocker tags are Hadi's Claude's estimates, not user research.

## 1. Where v2 stands

**Phase A** is done: the plan canvas, the requirements rail with the evaluator and progress, accounts, cloud and local autosave, My Plans, transcript import, mobile and the site. **Phase B** is merged except B23 and B25, which are parked. That includes the APAS extension with audit automation, the parser and several reports per plan (B1), plus placeholders, Lib Ed, plan health and pacing, workload, smart and natural-language search, PDF export, snapshot sharing, what-if compare, the minor and double-dip finders, registration handoff, sample plans, AP/IB credit, special semesters, catalog-change alerts, the unlocks graph, autofill and admission checklists. **Phase C** C0–C4 is merged (#79–#89, #92), and open #94 changes how C2/C3 catalog-text readings count toward progress.

The biggest gaps are not features but reach:
- Course and grade data **ends Fall 2024**.
- Only **Twin Cities** is covered.
- Sharing is a **fixed snapshot**.
- An imported APAS audit lives **in tab memory only**.
- **APAS injection**, which Hadi approved on 2026-10-27, isn't built.

## 2. Map of broad next directions

Tags: **V** = value to students (H/M/L) · **E** = effort (S/M/L) · **Blocked by** = what has to happen first · **Builds on** = new, or the existing feature it extends.

### T1. Planning intelligence

| Idea | V | E | Blocked by | Builds on |
|---|---|---|---|---|
| **What-if major explorer:** pick any major and see how many of your planned courses already count and how many terms it adds | H | M | CourseDog requirements for every major (cache); #94's counting rule | Extends B14 `src/features/minors/` + B13 compare |
| **Fastest path to graduate:** an autofill mode that finds the earliest graduation term under a credit cap | H | M | Offering data (T4) | Extends B24 `src/domain/autofill.ts` + B5 pacing |
| **Autofill constraints:** max credits per term, keep summers empty, keep my locked picks | M | S | — | Extends B24 |
| **Slip simulator:** "if I drop or fail X this term", show what moves and the new graduation term | M | S | — | Extends B22 `src/domain/unlocks.ts` + B5 |

### T2. Term-by-term workflow and registration

| Idea | V | E | Blocked by | Builds on |
|---|---|---|---|---|
| **Semester rollover:** when a term ends, mark its courses done, withdrawn or moved, lock them, and offer an APAS re-import | H | M | — | Extends lock state (E3.14), B21 reminder, B1 |
| **Section-level registration prep:** real sections, times and seats for next term, a time-conflict check, and a Schedule Builder hand-off | H | L | UMN class-schedule data access | Extends B16 `RegistrationDialog.tsx` |
| **Next-term priority list:** rank candidate courses by how much they unblock (critical path) | M | S | — | Extends B22 + B16 |
| **Registration calendar:** term dates and registration windows, with a `.ics` download | M | S | UMN academic-calendar data | New |

### T3. APAS depth

| Idea | V | E | Blocked by | Builds on |
|---|---|---|---|---|
| **APAS injection:** on APAS pages, show which unmet requirements the plan covers, and when | H | M | Approved (roadmap, 2026-10-27); the policy check stays in Phase Y | Extends `extension/` (B1) |
| **Use APAS placements for completed work:** where APAS applied a course (exceptions, substitutions), mirror it in planu.mn's progress | H | M | Hadi: may APAS override the evaluator? | Extends C4 `src/domain/apasCompare.ts` |
| **Opt-in: keep the audit with the plan,** so "APAS says" survives a reload | M | M | Changes the privacy promise (`apas-research.md` §3) and AMO's `"none"` declaration; Supabase column | Extends B1 `importedAudit.ts` |
| **Catalog year from APAS:** evaluate requirements against the version the student is held to | H | M | Historical CourseDog versions | Extends `src/server/programs/` + parsed `catalogTerm` |

### T4. Data freshness and coverage

| Idea | V | E | Blocked by | Builds on |
|---|---|---|---|---|
| **Catalog refresh:** courses and grades after Fall 2024, with every 2025 course id kept stable | H | L | Hadi: data source and permission to change `data/catalog.db` | Extends `src/server/catalog/` |
| **Upcoming-term offerings:** published schedules replace "historically offered" where they exist | H | M | Same UMN schedule access as T2 | Extends B4 `src/domain/health.ts` |
| **Other campuses** (Duluth, Morris, Rochester, Crookston) | M | L | Hadi: scope; per-campus CourseDog and Lib Ed | Extends catalog queries (hard-coded `UMNTC`) |

### T5. Collaboration and advising

| Idea | V | E | Blocked by | Builds on |
|---|---|---|---|---|
| **Live, revocable share link** that tracks the plan, unlike today's snapshot | M | M | Supabase RLS change on `can_view` | Extends B15 `src/features/sharing/` |
| **Advisor review:** an advisor opens a shared plan and leaves comments on terms and courses | M | L | Live sharing; a new comments table; Hadi: build for advisors at all? | New |
| **Advising-meeting packet:** the PDF plus open questions and health warnings, made for one meeting | M | S | — | Extends B10 `src/features/export/` + B6 |

### T6. Trust and transparency

| Idea | V | E | Blocked by | Builds on |
|---|---|---|---|---|
| **"Why this counts":** every check names its source (APAS, catalog structure, catalog text, inferred pattern) and links its heuristic | H | S | #94 landing | Extends #94's ⚠ N badge, `RequirementItem.tsx`, `heuristics.md` |
| **"Report a wrong requirement":** one click sends the program and rule to a triage queue that feeds per-program overrides | H | M | Where reports go (Supabase table or GitHub issue) | Extends `src/server/programs/creditOverrides.ts` |
| **"Data as of" panel:** catalog through Fall 2024, CourseDog fetch time, APAS "Prepared On" in one place | M | S | — | Extends the UI disclosures |

### T7. Access everywhere: accessibility, mobile, offline

| Idea | V | E | Blocked by | Builds on |
|---|---|---|---|---|
| **Plan end to end without a mouse:** a WCAG 2.2 AA pass on every editor flow, screen reader included | H | M | — | Extends #58/#59 ("+" and ‹ › moves) |
| **Phone-first editing:** one semester at a time, swipe between terms, every B feature reachable | M | M | — | Extends A32 `MobileRailSection.tsx` |
| **Installable, offline-capable plan:** view and edit offline, sync on reconnect | M | M | A conflict rule (last write wins?) | Extends `src/features/plans/` autosave + `localRepository.ts` |

## 3. Suggested sequencing

**Next 3 bets**
1. **Catalog refresh (T4).** Offering warnings, autofill, workload and search all rest on data that is two years old, and newer courses aren't in planu.mn at all. Start with a data-source spike while Hadi picks a source.
2. **What-if major explorer (T1).** It answers "can I switch or add a major without graduating late?" and reuses parts that already exist: the B14 finder, B13 compare and C2/C3 counting.
3. **APAS injection (T3).** Hadi already approved it, and it's the one APAS step left that needs nothing from UMN. It puts planu.mn's plan where students already check their audit.

**Runner-up:** semester rollover (T2). Fall 2026 ends in December, and it's the feature that keeps a plan true from term to term.

**Parked, matching the roadmap**
- **B23 community insight:** waits on a decision from Hadi and needs enough users first.
- **B25 friends:** waits on a decision from Hadi and needs a privacy design.
- **What-if APAS from a plan:** on hold until UMN enables the uAchieve Planner or "What If Courses".
- **Phase Y** (Supabase setup, privacy wording, UMN policy check): at the end, per Hadi.
- **Phase Z** AI chatbot: backburner. B27 natural-language search already covers its useful part.
- **Not bets until Hadi decides:** ideas that change the APAS memory-only rule (the T3 "keep the audit" idea) or need UMN data access (section-level registration, upcoming-term offerings).

## 4. Open questions for Hadi

1. Catalog refresh: which source? (GopherGrades, a UMN data request, CourseDog only)
2. Can `data/catalog.db` be rebuilt if every 2025 course id stays the same?
3. What-if explorer: every Twin Cities major, or one college (CSE) first?
4. May an imported APAS audit ever be saved with a plan if the student opts in? (Default: no.)
5. Build for advisors (live sharing, comments), or students only?
6. Other campuses: in scope for v2, or Twin Cities only?

## 5. Expert routing

Experts are from `delegation-plan.md`.

| Bet | Lead expert | Second reviewer's area | Note |
|---|---|---|---|
| Catalog refresh | **Requirements** | Editor & UI (offering, workload and search read it) | `data/catalog.db` and `src/server/catalog/` aren't in the expert table yet. The orchestrator should assign them to an area. |
| What-if major explorer | **Requirements** (`src/server/minors/`, `src/domain/`) | Plans & accounts (B13 compare, duplicate) | |
| APAS injection | **APAS** (`extension/`) | Requirements (the requirement status it shows) | |
| Semester rollover (runner-up) | **Plans & accounts** | Editor & UI (locks, the editor) | |
