# Phase B: who builds what

> Written by **Hadi's Claude** (orchestrator), 2026-10-27. Hadi gave the go-ahead (`docs/human/roadmap.md`). Feature numbers are Phase B rows in `feature-evaluation.md`. Phase Y (Hadi's review list) waits until the end. Phase Z (chatbot) stays parked.

## Rules (changed from Phase A)

- **No stacked PRs.** Every PR branches from the *latest* `v2/main`, stays small (one feature), and is merged with `--squash` as soon as it's approved. Squash-merging stacks caused every Phase A conflict.
- If a PR conflicts with `v2/main`, its author stops. Hadi's Claude rebuilds it on a fresh branch (cherry-pick), and the old PR is closed. Codex still never resolves conflicts.
- Hadi's Claude reviews every PR; Michael's Codex reviews Hadi's Claude's; Ishaan's Claude may review anything (comments only). Michael's Codex runs merges on `merge-ready` PRs, in the order posted on #16.
- Claim a feature on #16 before starting it.

## Tier 1 (now)

| Owner | Features | Owns (new folders) |
|---|---|---|
| **Ishaan's Claude** | **B1 APAS import, step 1: the browser extension's fetch and hand-off** (per #28's design). The planu.mn side receives the raw report into memory only. The parser comes later, once humans provide sample reports. | `extension/` (new top-level), `src/features/apas/`, `src/app/plan/apas/` |
| **Michael's Codex** | B10 advisor-ready PDF/print export · B15 read-only sharing link + "copy to my plans" · B13 what-if: duplicate a plan, compare two plans · B9 professor insight in the preview (grades by instructor; RMP later) · B20 dark mode tokens + Cmd/Ctrl+K search focus | `src/features/plans/`, `src/features/preview/`, `src/features/sharing/`, `src/features/export/`, new routes they need |
| **Hadi's Claude** | B2 placeholder courses · B3 Lib Ed + Writing Intensive tracker · B4 offering-term warnings · B5 graduation pacing · B6 plan health check · B7 workload meter · B8 smart search filters · B11 elective badge · B12 double-dip finder · B14 minor finder · B19 special semesters (abroad, co-op, leave) | `src/domain/`, `src/features/plan-editor/`, `src/features/requirements/`, `src/features/search/`, `src/server/catalog/`, `src/server/programs/` |

**Contracts:** additions go in `docs/agent/architecture.md`, in the same PR that adds them. Plan shape changes (e.g. placeholders, special semesters) must stay 2025-row-compatible. New optional fields only, and old rows must still load.

## Tier 2 (after tier 1, assigned on #16)

B16 registration handoff · B17 department sample-plan templates · B18 AP/IB/transfer entry · B21 catalog-change alerts · B22 prerequisite "unlocks" graph · B23 community insight · B24 autofill · B25 friends · B26 admission-to-major checklists · B27 natural-language search · B1 step 2: the APAS parser (blocked on sample reports).
