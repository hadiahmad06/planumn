# Phase A — who builds what

> Written by **Hadi's Claude** (Claude Code, Opus 5.5), 2026-10-26.
> Hadi decided (`docs/human/roadmap.md`): Phase A is built in parallel, Hadi's Claude decides the split, both sides review each other's PRs when done, **Codex does not deal with merge conflicts, and Hadi's Claude merges.**
> Feature numbers (A1–A33) refer to `feature-evaluation.md` § Phase A. A34 (AI chatbot) is Phase Z: nobody builds it.

## Principle

Split by **ownership of folders**, so the two sides almost never edit the same file. Contracts between features are fixed in `architecture.md`.

## Hadi's Claude — `v2/hadi/*`

| PR | Branch | Features | Owns |
|---|---|---|---|
| 0 | `v2/hadi/scaffold` (**merged first, before Codex starts**) | A1 catalog data + API, A2 search API, A3 design tokens, shared types and contracts, CI | `src/domain/`, `src/contracts/`, `src/server/catalog/`, `src/app/api/courses/`, `src/app/globals.css`, `src/app/layout.tsx` (Codex may add to it) |
| 1 | `v2/hadi/plan-canvas` | A4 grid + drag-and-drop, A5 credit totals, A6 add/remove semesters and years, A7 editable title, A8 lock state, A9 course cards, A10 hide seasons, A13 top-bar search dropdown + drag from results; top bar + plan header shell | `src/features/plan-editor/`, `src/features/search/` |
| 2 | `v2/hadi/requirements` | A22 program picker, A23 CourseDog fetch, A24 requirement display, A25 evaluator, A26 progress widget, A27 rail + drag from rail, A28 filter requirements, A29 prerequisite checking | `src/features/requirements/`, `src/server/programs/`, `src/app/api/programs/` |
| 3 | `v2/hadi/polish-mobile` | A30 layout options, A31 right-click course menu, A32 mobile | `src/features/plan-editor/` |

PRs 1–3 are stacked: each one's base is the previous branch.

## Michael's Codex — `v2/michael/*`

| PR | Suggested branch | Features | Owns |
|---|---|---|---|
| 1 | `v2/michael/preview` | A11 course preview (click = persistent panel, hover = temporary; code, title, credits, description, grade distribution chart, terms offered), A12 several panels for comparing (draggable, kept on-screen, click brings to front) | `src/features/preview/` |
| 2 | `v2/michael/accounts` | A14 sign up / log in (Supabase email + password, same rules as 2025), A15 user menu + Settings modal (render `<DisplaySettingsForm />` inside it), A21 delete account | `src/features/auth/`, `src/server/supabase/`, `src/proxy.ts`, `src/app/auth/` |
| 3 | `v2/michael/persistence` | A16 Supabase `PlanRepository` + autosave + `<SaveStatus />`, A17 signed-out localStorage autosave + `/plan/autosave` + "overwrite autosave?" prompt on `/plan/new`, A18 My Plans page (counts, rename, soft delete 30 days, recover, permanent delete, clear deleted), A19 loading/error states for `/plan/[planId]` | `src/features/plans/`, `src/app/plan/` (except `import/`), `src/app/plans/`, `src/app/api/plans/` |
| 4 | `v2/michael/transcript` | A20 upload a UMN unofficial transcript PDF → new plan with past courses `locked` (use `findCourseIdsByCode`) | `src/features/transcript/`, `src/app/plan/import/`, `src/app/api/transcript/` |
| 5 | `v2/michael/site` | A33 landing page, `/info/contact`, `/info/privacy`, OG image, favicon/logo, analytics | `src/app/page.tsx`, `src/app/info/`, `src/features/marketing/`, `public/` |

Stack them however suits you.

## Shared files

- `package.json` / `package-lock.json`: both sides add dependencies. Expect conflicts; **Hadi's Claude resolves them**.
- `src/app/layout.tsx`: Codex may add providers or analytics. Keep the diff small.
- `src/app/globals.css`: Hadi's Claude owns it. Codex: need a token? Add it in a block marked `/* added by Michael's Codex */` at the end of `:root`, or ask in the PR.
- `src/components/ui/`: either side may **add** new files. Edit only files you created.
- Placeholder files from the scaffold (`PreviewLayer.tsx`, `UserMenu.tsx`, `SaveStatus.tsx`, `src/app/page.tsx`, `src/app/plan/new/*`, `src/features/preview/store.ts`) belong to Codex. Replace them freely, but keep the contract in `architecture.md` working.

## Workflow

1. **First:** Codex reviews and merges the scaffold, PR #15. Both sides branch from `v2/main` after that.
2. **Codex never merges or rebases** `v2/main` into its branches and never resolves conflicts. If v2/main moves, ignore it. Hadi's Claude handles it.
3. Every PR targets `v2/main` (or the previous branch in a stack) and passes CI (`npm run check && npm run build`).
4. Every PR description lists: features (A-numbers), what was tested, known gaps, and **Contract change** if any.
5. When a side finishes all its PRs, it ticks its boxes on the **Phase A tracking issue** (#16).
6. When both sides are done: Codex reviews every `v2/hadi/*` PR, and Hadi's Claude reviews every `v2/michael/*` PR. Each finding is a PR review comment. The author fixes it on the same branch.
7. **Merging (Hadi's "option 1"):** Hadi's Claude is in charge. It decides merge order, resolves every conflict on the PR's branch, and then adds the label **`merge-ready`**. **Michael's Codex runs the merge**: `gh pr merge <n> --squash`, only on PRs labeled `merge-ready`, in the order Hadi's Claude gives on issue #16. If a `merge-ready` PR shows a conflict or failing CI, don't fix it. Remove the label and comment on the PR.

## Needs a human

- **Supabase:** Codex needs `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ask Michael or Hadi). **Don't change the production `plans` table or its RLS policies** without Hadi or Michael approving. 2025 also used an RPC `now_plus_30_days` for soft delete.
- **APAS reports** for Phase B: Hadi and Michael should collect 3–5 from different colleges.
