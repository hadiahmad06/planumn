# Phase 0 — Aggregate feature choices

> Written by **Hadi's Claude** (Claude Code, Opus 5.5), 2026-10-26.
> Status: **draft proposal**. Nothing here is decided until Hadi or Michael writes it into `docs/human/`.

## Goal

Agree on **which features v2 has**, before any methodology, stack or architecture work.
Phase 0 ends when a human-written feature spec exists in `docs/human/`.

## Steps

| # | Step | Owner | Output |
|---|---|---|---|
| 0.1 | Inventory every 2025 feature across all branches | Hadi's Claude | `docs/agent/2025-feature-inventory.md` ✅ |
| 0.2 | Michael's Codex reviews the inventory: adds anything missing, corrects statuses (especially the `AI_Advisor` "Partial" rows, since that's Michael's branch) | Michael's Codex | `docs/agent/codex-notes.md` |
| 0.3 | Hadi and Michael mark each inventory row as **Keep**, **Rework**, **Cut** or **Later** | Hadi, Michael | Notes in any form |
| 0.4 | Hadi and Michael list **new** features for v2 that weren't in 2025 | Hadi, Michael | Notes in any form |
| 0.5 | Answer the open questions below | Hadi, Michael | Notes in any form |
| 0.6 | Write the v2 feature spec | Hadi or Michael (agents may type it only from dictation) | `docs/human/features.md` |
| 0.7 | Agents turn the spec into a tiered build order (MVP → next → later) for Phase 1 | Hadi's Claude / Michael's Codex | `docs/agent/phase-1-*.md` |

## Open feature questions

Grouped by inventory section. Each one changes what gets built.

**Core shape**
1. What is the main surface of the plan view: the requirements rail (Michael's 2026 PRD), the catalog/search (2025 production), or something else?
2. Is UMN Twin Cities the only campus, or are other UMN campuses in scope?
3. Should v2 work fully without an account (local autosave, as in 2025), or require sign-in?

**Plan editing**
4. Which layout controls carry over: transpose, hide seasons, year accordions, semester selection? All of them overlap.
5. Right-click context menu (move to season/year, copy code, open in catalog): keep?
6. Is autofill (generating future semesters toward requirements) in scope for v2, or still parked?

**Programs & requirements**
7. Are requirements the headline v2 feature, i.e. "how close am I to graduating"?
8. Is prerequisite checking a visible planner feature (warnings on cards), or advisor-only as in 2025?
9. Do Lib Ed requirements count toward progress? The data exists, but no UI was ever built.

**AI Advisor**
10. Read-only (2025), or allowed to propose/apply plan changes?
11. Is the model picker shown to users, or does the app choose the model?

**Accounts & sharing**
12. Sign-in methods: email/password only (2025), or also Google / UMN SSO?
13. Is sharing (read-only link, fork into my account) in v2 MVP?
14. Transcript PDF import: keep? Is any other import source wanted (e.g. a degree-audit export)?

**Platform**
15. Mobile: tap-to-add picker (2026 PRD) vs. touch-drag, and is mobile at feature parity?
16. Dark mode in MVP?

## Out of scope for Phase 0

Stack, framework, database, data pipeline, testing strategy and file structure. Those are methodology and come after the feature spec is written.
