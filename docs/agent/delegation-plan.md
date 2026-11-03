# Delegation: one orchestrator, expert workers, equal reviewers

> Written by **Hadi's Claude**, 2026-11-03. Hadi approved it the same day ("Great. Record this in the repo"; `docs/human/roadmap.md`).
> This replaces the per-phase split docs for *how* work moves. *What* gets built is still in `phase-c-plan.md` and `feature-evaluation.md`.

## Why

Problems seen in #16 through 2026-10-28:
- **Merge waits.** Approval, the `merge-ready` label and the merge button were held by different agents, so approved PRs waited (#70–#72, then #82).
- **Too few reviewers.** After Ishaan's Claude went offline, every PR had one reviewer.
- **Lost state.** Coordination lived in 120+ comments on #16, and work done in a session that ended was gone (C3's commit `9b2c7f0` never reached GitHub).

## Roles

**Orchestrator (one: Hadi's Claude).**
- Turns human decisions into tickets and routes each ticket to an expert.
- Sets the merge order and keeps the status board (the body of #16).
- Doesn't write feature code. Has no special say in review.

**Workers (many, short-lived).**
- One ticket = one fresh worker, on a fresh branch from `v2/main`. Branches are `v2/<human>/<slug>`, or the session's assigned branch for a cloud session.
- A worker's expertise is the context it's given, not who it is: its folders, the docs for that area and the contracts it touches. Claude or Codex can fill any slot.
- Everything a worker needs is in its ticket, and everything it did is in its PR. If a usage limit or restart hits, the next worker picks up from those.

| Expert | Owns | Docs to load |
|---|---|---|
| **Requirements** | `src/domain/` requirement files, `src/server/programs/`, `src/server/minors/`, `src/features/requirements/` | `phase-c-plan.md`, `requirement-coverage.md`, `heuristics.md` |
| **APAS** | `extension/`, `src/features/apas/`, `src/app/plan/apas/` | `apas-research.md`, `extension/README.md` |
| **Plans & accounts** | `src/features/plans/`, `sharing/`, `export/`, `catalog-changes/`, Supabase | `architecture.md` (contracts) |
| **Editor & UI** | `src/features/plan-editor/`, `preview/`, `search/`, `unlocks/`, `src/components/ui/` | `architecture.md`, `heuristics.md` |

**Routing.** The orchestrator routes each ticket by the files it will touch.
- Two tickets that touch the same files run one after the other (C2 before C3), never stacked as PRs.
- A ticket that crosses two areas names a lead expert. The other area's owner is one of its reviewers.

**Reviewers (a pool, equal authority).**
- Each PR gets **two reviewers**, neither of whom wrote it. Mixing models (one Claude, one Codex) gives the most varied review. A fresh Claude session that didn't write the PR counts as a reviewer.
- **Any reviewer can block**, but only with a finding they can reproduce.
- **Any reviewer can confirm a fix**, not only the one who found it.
- If the reviewers disagree, **a human decides** (Hadi or Michael). The orchestrator never breaks a tie.

## How a ticket moves

1. **Ticket.** A GitHub issue, labelled `expert:<area>`:
   ```
   Goal · A/B/C number · Owns (paths) · Contract changes · Acceptance checks · Blocked by
   ```
2. **Build.** The worker runs `npm run check && npm run build`, adds `heuristics.md` rows for any guesses about UMN data, and opens a PR listing what it tested and any known gaps.
3. **Review.** Two reviewers review the exact head commit. Findings go in PR reviews.
4. **Merge.** Once a PR has two approvals at its head commit, green CI and no open blocking finding, the orchestrator squash-merges it in its posted order (D1).
   - An approval is a GitHub approval, or a PR comment that says "Approve" and names the head commit. Claude reviewers share the `hadiahmad06` account, and GitHub doesn't let a PR's author approve their own PR, so their approvals are comments.
   - No `merge-ready` label is needed. Any reviewer may still merge a PR that passes the check.
5. **Status.** The orchestrator edits the body of #16 in place. Comments on #16 are only for human decisions, claims and handoffs.

## Waiting on a human

Hadi, 2026-11-03: keep going while a decision is pending, and he can answer later.
- Every question to a human is posted on #16 with a **default**. Work goes on, either with the default or on tickets the question doesn't block.
- If the answer turns out different from the default, the rework is a new ticket. Nothing is merged on a default that changes a `docs/human/` rule.

## Decisions (Hadi, 2026-11-03)

| # | Question | Answer |
|---|---|---|
| D1 | Can the orchestrator merge once the check in step 4 passes? | **Yes.** |
| D2 | Two reviewers per PR? | **Yes.** |
| D3 | Can cloud sessions push `v2/hadi/<slug>` branches and open PRs? | **Yes.** |
| D4 | Is C3 (`9b2c7f0`) still on Hadi's machine? | It was. It's now pushed as `origin/v2/hadi/requirements-c3-local`. A rebuild (`e8065d2`) also exists; reviewers compare the two. |

## First wave (2026-11-03)

1. **Orchestrator:** check that #82 applies to the current `v2/main` and label it `merge-ready`. Turn the body of #16 into the status board. Record this doc.
2. **Requirements expert:** C3 pattern rules, on top of #82 and opened on a fresh branch once #82 lands. Then the C4 fixture tests.
3. **Editor & UI expert:** the #74 (B22) review follow-up. Alternative ("or") prerequisites make the wording about delays and the critical path wrong, and the inferred graph needs its `heuristics.md` row.
4. **APAS expert (after C3):** C4's "APAS says" display, then importing more than one audit.
