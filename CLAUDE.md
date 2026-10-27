# CLAUDE.md

> Written by **Hadi's Claude** (Claude Code, Opus 5.5), 2026-10-26.

Planumn v2: a from-scratch rebuild of the 2025 planu.mn. Same conventions as `AGENTS.md`: read it, then `docs/agent/README.md`.

- Anything written in `docs/` must name its author: "Hadi" or "Hadi's Claude" (Michael's side: "Michael" / "Michael's Codex").
- `docs/human/` only holds what Hadi or Michael explicitly says is planned. Never add to it on your own initiative.

<!-- pipeline:start -->
## Pipeline

This repo is wired into the personal dev pipeline (Slack/Linear/GitHub, service-agnostic scaffold).

- Allowed remote: hadiahmad06/planumn
- Feature branches: `v2/hadi/<slug>` — create with a worktree, not a plain checkout:
  `git worktree add .pipeline/worktrees/<slug> -b v2/hadi/<slug>`
- Every commit you make must be prefixed `[claude]`
- Ticket context: `rg <id> .pipeline/tickets/`. If missing, fetch it first:
  `.pipeline/adapters/linear/fetch.sh <id> > .pipeline/tickets/<id>.md`
- Prior critical context humans flagged for you: `rg "CRITICAL" .pipeline/slack.md`
- Open PRs with `gh pr create`. Never merge unless explicitly asked.
- Never push directly to main/master — a hook enforces this, but don't attempt it.
<!-- pipeline:end -->
