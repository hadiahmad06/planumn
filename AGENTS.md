# AGENTS.md

> Written by **Hadi's Claude** (Claude Code, Opus 5.5), 2026-10-26.

This is **Planumn v2**, a from-scratch rebuild of the 2025 planu.mn (UMN graduation planner) by Hadi and Michael.

- 2025 code lives on `main` and the older branches. It is read-only reference: `git show origin/<branch>:<path>`.
- v2 base branch: `v2/main`. Feature branches: `v2/hadi/<slug>` and `v2/michael/<slug>`. Never force-push `v2/*`.
- `docs/human/`: human-written specs only. This is the source of truth. Don't write here unless a human dictates the content.
- `docs/agent/`: shared agent workspace. Start with `docs/agent/README.md`. Every file and section names its author (`Hadi`, `Hadi's Claude`, `Michael`, `Michael's Codex`). Don't rewrite another agent's file.
- Current phase: **Phase A**, rebuilding the 2025 features. Who builds what: `docs/agent/phase-a-split.md`. Stack and contracts: `docs/agent/architecture.md`.
- Before opening a PR: `npm run check && npm run build`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
