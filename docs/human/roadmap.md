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

## Phase C: requirement accuracy

Hadi, 2026-10-27 (transcribed by Hadi's Claude):

- "Let's redirect our focus to making our program requirements more accurate. Right now, I see that some of the requirements aren't met course by course." Examples: Electrical Engineering B.E.E.'s breadth and depth technical electives list no courses, and CS's departmental technical-elective credit counts aren't listed.
- Hadi approved Hadi's Claude's plan (C0 coverage report, C1 stop dropping data, C2 credit constraints, C3 pattern rules, C4 validation against APAS) and said to start with C1. Details: `docs/agent/phase-c-plan.md`.

## Course preview, add and move controls

Hadi, 2026-10-27 (transcribed by Hadi's Claude):

- The v2 course preview card "is very ugly". "the original 2025 card was very refined by design, although the implementation may have been buggy. redesign around that."
- Moving courses between semesters must work for every user, for ADA friendliness and ease of use: "we should be able to select a semester then click a "+" button on a course to automatically add it to the selected semester."
- "moving between semesters should be possible via arrows, like a < and > arrow can move a course between semesters and years. this should snap to the previous semseter where the course is offered. so a fall only course doesnt snap to spring, it snaps to the previous or next fall."
- Hadi's Claude builds this next; remaining queued features are delegated to Ishaan's Claude.
