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
