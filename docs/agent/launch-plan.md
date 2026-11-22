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
| ~~L3~~ | #99 | — | **Dropped** (Hadi, 2026-11-22: "backwards compatibility does not matter"). #106 closed unmerged; its branch keeps the 2025 variant catalogue | — | — | — |
| L4 | #100 | A | Production gate: hide APAS import until the extension is published and the UMN policy check is done | APAS | Requirements ("APAS says" in the rail) | — |
| L5 | #101 | A | End-to-end smoke tests (Playwright) of the main flows, in CI | Editor & UI | Plans & accounts | — |
| L6 | — | A | Error reporting | Plans & accounts | Editor & UI | Hadi: which service (default on #16: Vercel logs + a React error boundary, no new vendor) |
| L7 | — | A | Beta deploy (default: a fresh plans table, chosen before the beta writes rows): the existing `planumn` Vercel project (its bot already comments "Ignored Build Step"), env, Supabase redirect URL, `data/catalog.db` in the server bundle | Hadi + Plans & accounts | — | Hadi (Supabase keys and Vercel settings) |
| L8 | — | A | Human QA pass on a checklist | Hadi (Michael if he agrees) | — | L7 |
| L9 | — | B | APAS-check the 10–20 most common majors. Student APAS reports follow C4's rule: run locally, never committed (they hold names, IDs, GPAs) | Requirements | APAS | Student APAS reports |
| L10 | — | B | Publish the extension (store accounts, listings, review) | APAS | Plans & accounts | UMN policy check (Phase Y) |

**Merge order:** #102, #96 and L2 (#104) are merged. Next: L1 (after L2), then L4 and L5 in any order.

## Next.js advisory

Next.js 16.4.3 has a published security advisory. When a coding agent runs `next build`, 16.4.3 stops once with `SecurityFatalError` and continues on a retry within 5 minutes (`node_modules/next/dist/lib/upgrade/nudge.js`); CI and Vercel aren't affected (CI on this PR passed). Hadi asked for the upgrade on 2026-11-22; Hadi's Claude reads his "forget the previous autoignore command" as withdrawing his earlier "No" (`docs/human/roadmap.md`). **Fixed by #102** (16.4.6, merged 2026-11-22): `npm audit --omit=dev` reports no Next.js advisory.

## Breaking changes allowed (2026-11-22)

> Hadi's Claude, 2026-11-22.

Hadi: "backwards compatibility does not matter. Breaking changes are fully permitted." (`docs/human/roadmap.md`, "Launch"). So:
- v2 doesn't have to open plans saved by the 2025 app, and the `plans` row shape, course ids and `data/catalog.db` tables may change. Changes still go under **Contract change** in the PR.
- L1 no longer has to keep every old course id; it reports id changes (the L5 suite in #105 relies on CSCI 1933, 2011 and 2041 keeping ids 94, 77 and 1473).
- **At the bar A switch, 2025 cloud plans are a hazard, not just unreadable.** `serverRepository.ts` doesn't validate rows on `list()`/`get()`, so a 2025 row with a null title or a course without `lock` opens in the editor and then every save fails ("The plan is invalid"); the edits stay in the tab until it closes or another plan opens, then they are gone (#107 review). Only the browser autosave shows "could not be read". **Proposed default (L7, posted on #16):** v2 uses a fresh plans table, and the 2025 `plans` table is left untouched and unused. Deleting the old rows is Hadi's call. The table must be chosen **before the beta writes any v2 rows**, or beta testers' plans are stranded at the switch. It needs the same RLS policies and `now_plus_30_days` behaviour, and `serverRepository.ts` hard-codes `plans` today. So does account deletion (`src/app/auth/delete/route.ts`), and the privacy page promises deletion removes a user's plans: L7 must delete the user's rows from **both** tables (or clear the 2025 table first).
- Snapshot links (`src/features/sharing/`) pack only `title`, `programs` and, per term, course ids, locks, placeholders and term kind. A change to those fields, or to course ids (L1), changes what old `v1.` links decode to; the PR names it under **Contract change**. Other row columns don't affect them.
