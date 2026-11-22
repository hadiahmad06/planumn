# Launch plan: beta now, switch at bar A, then bar B

> Written by **Hadi's Claude** (orchestrator), 2026-11-22. Hadi approved the bars and the "beta now, switch at A" call the same day (`docs/human/roadmap.md`, "Launch").

## Bars

| Bar | Means | Estimate (2026-11-22) |
|---|---|---|
| **A. Better than what's live** | v2 replaces the 2025 planu.mn | 2–3 weeks; ~6–10 h of Hadi's time (Supabase, privacy wording, QA) |
| **B. Viable product** | Students can rely on it | 6–10 weeks total; ~15–25 h of Hadi's time plus student testers |

**Beta now:** v2 on a separate host (Vercel preview or a subdomain), invite-only, while bar A is finished. **Switch at A:** planu.mn serves v2. **Market at B.**

## Course data finding (2026-11-22)

GopherGrades' `ProcessedData.db` (samyok/gophergrades, `afb1c95`, 2026-11-15), compared with `data/catalog.db`:

| | `data/catalog.db` | GopherGrades now |
|---|---|---|
| Grade terms | 1175–1249 (through Fall 2024) | 1175–1265 (through **Summer 2026**) |
| Courses (`classdistribution`) | 9,731 | 11,278 (**+1,547**) |
| Course ids | — | **all 9,731 old ids unchanged** (same campus/subject/number → same id) |
| `courseGroupId` (CourseDog id; v2's requirement and Lib Ed lookups use it) | 9,486 mapped | column absent |
| Lib Ed (`libed` / `libedAssociationTable`) | 67 / 15,435 | 17 / 2,711 |

So swapping the file alone would break requirement resolution and Lib Ed. v1 added `courseGroupId` and Lib Ed with Python (`data/scripts/*.py` on `main`). The refresh rebuilds both with a reproducible script (ticket D1). Permission: Social Coding UMN, via Hadi; credit in the footer and info pages (ticket D2).

## Tickets

Expert areas are `delegation-plan.md`'s. `data/catalog.db`, `src/server/catalog/` and catalog build scripts go to **Requirements** (assigned by the orchestrator, 2026-11-22).

| # | Bar | Ticket | Lead expert | Blocked by |
|---|---|---|---|---|
| D1 | B (pulled forward) | Catalog refresh from GopherGrades, ids kept, `courseGroupId` + Lib Ed rebuilt by script | Requirements | — (D2 for the "data through" string) |
| D2 | A | Credit GopherGrades / Social Coding UMN in the footer and info pages; one "data through" constant | Editor & UI | — |
| A1 | A | 2025 plans load in v2: fixture tests from 2025's plan shape, plus a read-only check script for a real export | Plans & accounts | — |
| A2 | A | Production gate: hide APAS import until the extension is published and the UMN policy check is done | APAS | — |
| A3 | A | End-to-end smoke tests (Playwright) of the main flows, in CI | Editor & UI | — |
| A4 | A | Error reporting | Plans & accounts | Hadi: which service (default: Vercel logs + error boundary, no new vendor) |
| A5 | A | Beta deploy: Vercel project, env, Supabase redirect URL, `data/catalog.db` in the server bundle | Hadi + Plans & accounts | Phase Y (Hadi) |
| A6 | A | Human QA pass on a checklist | Hadi / Michael | A5 |
| B1 | B | APAS-check the 10–20 most common majors | Requirements | Student APAS reports |
| B2 | B | Publish the extension (store accounts, listings, review) | APAS | UMN policy check (Phase Y) |

## Known blocker

`next build` on Next.js 16.4.3 now stops with `SecurityFatalError` (a known vulnerability). CI was green on 2026-11-04 but will likely fail on the next PR. Hadi said not to run `next upgrade --agent=security` (2026-11-22). Until Next.js is changed some other way, PRs can't get green CI and the beta can't be built.
