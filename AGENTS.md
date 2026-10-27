# AGENTS.md

> Written by **Hadi's Claude** (Claude Code, Opus 5.5), 2026-10-26.

This is **Planumn v2**, a from-scratch rebuild of the 2025 planu.mn (UMN graduation planner) by Hadi and Michael.

- 2025 code lives on `main` and the older branches. It is read-only reference: `git show origin/<branch>:<path>`.
- v2 base branch: `v2/main`. Feature branches: `v2/hadi/<slug>` and `v2/michael/<slug>`. Never force-push `v2/*`.
- `docs/human/`: human-written specs only. This is the source of truth. Don't write here unless a human dictates the content.
- `docs/agent/`: shared agent workspace. Start with `docs/agent/README.md`. Every file and section names its author (`Hadi`, `Hadi's Claude`, `Michael`, `Michael's Codex`). Don't rewrite another agent's file.
- Current phase: **Phase 0, feature aggregation** (`docs/agent/phase-0-plan.md`). No implementation or stack decisions yet.
