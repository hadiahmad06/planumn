# Roadmap

> Written by **Hadi's Claude**, transcribing **Hadi**'s words from chat on 2026-10-26. Only decisions Hadi or Michael explicitly state go here.

## Sequencing

Hadi, verbatim:

> "first we want to implement features that we had already partially or successfully implemented in our 2025 version. THEN we can move onto new features that were added today."

- **Phase A:** features that were partially or fully built in the 2025 version. **Implement fully.**
- **Phase B:** the new features proposed on 2026-10-26.
- **Phase Z (backburner):** the AI chatbot. Hadi: "lets put AI chatbot on a backburner, (Phase Z)".

Which features fall into each phase, and their order, are still a proposal: see `docs/agent/feature-evaluation.md`.

## How Phase A gets built

Hadi, 2026-10-26:

- Hadi's Claude and Michael's Codex build Phase A **in parallel**. Hadi's Claude decides who does what (`docs/agent/phase-a-split.md`).
- When both are done, **each reviews the other's work through pull requests**.
- **Codex does not deal with merge conflicts. Hadi's Claude is in charge of merging.**
- Hadi chose "option 1" (2026-10-26): Hadi's Claude keeps PRs conflict-free and decides merge order, then labels a PR `merge-ready`. **Michael's Codex reviews and runs the merge.** Hadi's Claude does not run `gh pr merge` itself.

## APAS import (Phase B)

Hadi, 2026-10-26 (transcribed by Hadi's Claude):

- Build a **Chrome/Firefox extension** that automatically loads the APAS pages and **stops at the UMN login page**. The student logs in themselves, so planu.mn never asks for their email or password and Duo 2FA isn't a problem. Hadi: asking for credentials "is not a good plan"; the extension approach lets "the user … trust the feature."
- Order: **the extension's fetch and hand-off to planu.mn first; build the parser after that works.** Hadi: "build parser AFTER extension performs the fetch and hand off."

## Account deletion

Hadi, 2026-10-26: **"enable account deletion."** In production it turns on when `SUPABASE_SERVICE_ROLE_KEY` is set in the deployment environment (server-only). A human has to add the key; agents never handle it.

## Phase Y and Phase X

Hadi, 2026-10-26:

- **Phase Y**: things Hadi **needs to look at** once the current work is done:
  - Supabase setup: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and the `/auth/callback` redirect URL
  - Privacy page wording (`/info/privacy`)
  - Whether optional requirements such as CS B.S. "Technical Electives (up to 22 credits)" count toward progress (they count 0 today)
- **Phase X**: "eh, if we have the time to think about it." Nothing assigned yet.

## Phase B go-ahead

Hadi, 2026-10-27: **"phase B go-ahead. phase y will be dealt with at the end."** Who builds what: `docs/agent/phase-b-split.md`.
