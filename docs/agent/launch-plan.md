# Launch plan: beta now, switch at bar A, then bar B

> Written by **Hadi's Claude** (orchestrator), 2026-11-22. Hadi agreed to "A, then B" and to the "beta now, switch at A" call the same day (`docs/human/roadmap.md`, "Launch"). Everything else here — bar definitions, tickets, routing, defaults — is Hadi's Claude's proposal.

## Bars (Hadi's Claude's definitions)

| Bar | Means | Estimate (2026-11-22) |
|---|---|---|
| **A. Better than what's live** | v2 replaces the 2025 planu.mn | 2–3 weeks; ~6–10 h of Hadi's time (Supabase, privacy wording, QA) |
| **B. Viable product** | Students can rely on it: fresh course data, requirements checked against APAS on the most common majors, the extension published | 6–10 weeks total; ~15–25 h of Hadi's time plus student testers |

**Beta now** (approved): v2 on a separate host, invite-only, while bar A is finished. **Switch at A** (approved): planu.mn serves v2. Proposed, not decided: announce it widely only at B.

Phase Y (Supabase setup, privacy wording) is "dealt with at the end" in the roadmap. Hadi's Claude reads "beta now" as pulling the Supabase setup and privacy wording forward for the beta; the UMN policy check stays in Phase Y and gates only L10. This reading is posted on #16 with that default.

## Course data finding (2026-11-22)

GopherGrades' `ProcessedData.db` (samyok/gophergrades; L1 pins the commit that last changed the file), compared with `data/catalog.db`:

| | `data/catalog.db` | GopherGrades now |
|---|---|---|
| Grade terms | 1175–1249 (through Fall 2024) | 1175–1265 (through **Summer 2026**) |
| Courses (`classdistribution`) | 9,731 | 11,278 (**+1,547**, ids 9732–11278) |
| Course ids | — | **all 9,731 old ids unchanged** (same campus/subject/number → same id); 266 kept their id with a changed title |
| `courseGroupId` (CourseDog id; v2's requirement lookups and Lib Ed search filter use it) | 9,486 mapped | column absent; `onestop` URL present on 10,356 rows |
| Lib Ed (`libed` / `libedAssociationTable`) | 67 / 15,435 | 17 / 2,711 |

So swapping the file alone drops `courseGroupId`. v1 derived it from the `onestop` URL (`data/scripts/extract_and_add_courseGroupId.py`, on `dev`, not `main`); L1 does the same in a reproducible script, with CourseDog for the gaps. v1 had no working Lib Ed script (`libed_associations.py` on `main` is empty), and `heuristics.md` already calls catalog.db's Lib Ed tables wrong (v2's Lib Ed comes from CourseDog), so L1 decides whether the remaining read of `libedAssociationTable` keeps the old tables or moves to CourseDog. Permission: Social Coding UMN, via Hadi; credit in the footer and info pages (L2).

## Tickets

Launch tickets are numbered **L1–L10** (not D/A/B, which already name Hadi's decisions and the Phase A/B features). Expert areas are `delegation-plan.md`'s. Routing added by the orchestrator, 2026-11-22: `data/catalog.db`, `src/server/catalog/` and catalog build scripts → **Requirements**; `src/features/marketing/`, `src/app/info/`, `e2e/` and `.github/workflows/` → **Editor & UI**; the app error boundary → **Plans & accounts**.

| # | Issue | Bar | Ticket | Lead expert | Second reviewer's area | Blocked by |
|---|---|---|---|---|---|---|
| L1 | #97 | B (pulled forward) | Catalog refresh from GopherGrades: ids kept, `courseGroupId` rebuilt by script, Lib Ed source decided | Requirements | Editor & UI | **L2** (rebases onto it for the "data through" constant) |
| L2 | #98 | A | Credit GopherGrades / Social Coding UMN in the footer and info pages; one "data through" constant replacing every hard-coded "Fall 2024" | Editor & UI | Plans & accounts (`src/features/export/` uses the string) | — |
| L3 | #99 | A | 2025 plans load in v2: fixture tests from 2025's plan shape, plus a read-only check script for a real export | Plans & accounts | Editor & UI | — |
| L4 | #100 | A | Production gate: hide APAS import until the extension is published and the UMN policy check is done | APAS | Requirements ("APAS says" in the rail) | — |
| L5 | #101 | A | End-to-end smoke tests (Playwright) of the main flows, in CI | Editor & UI | Plans & accounts | — |
| L6 | — | A | Error reporting | Plans & accounts | Editor & UI | Hadi: which service (default on #16: Vercel logs + a React error boundary, no new vendor) |
| L7 | — | A | Beta deploy: the existing `planumn` Vercel project (its bot already comments "Ignored Build Step"), env, Supabase redirect URL, `data/catalog.db` in the server bundle | Hadi + Plans & accounts | — | Hadi (Supabase keys and Vercel settings) |
| L8 | — | A | Human QA pass on a checklist | Hadi (Michael if he agrees) | — | L7 |
| L9 | — | B | APAS-check the 10–20 most common majors. Student APAS reports follow C4's rule: run locally, never committed (they hold names, IDs, GPAs) | Requirements | APAS | Student APAS reports |
| L10 | — | B | Publish the extension (store accounts, listings, review) | APAS | Plans & accounts | UMN policy check (Phase Y) |

**Merge order:** #102 (Next.js) and #96 first; then L2 → L1; L3, L4, L5 in any order (L5 last if `package.json` conflicts).

## Next.js advisory

Next.js 16.4.3 has a published security advisory. When a coding agent runs `next build`, 16.4.3 stops once with `SecurityFatalError` and continues on a retry within 5 minutes (`node_modules/next/dist/lib/upgrade/nudge.js`); CI and Vercel aren't affected (CI on this PR passed). Hadi asked for the upgrade on 2026-11-22: #102 moves to 16.4.6.
