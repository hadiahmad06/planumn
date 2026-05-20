# UI Redesign v1 — plan view, supporting surfaces, and design-token consolidation

## Problem Statement

As a student using planu.mn today, the plan view doesn't match how I actually think about my degree. The left half of my screen is a persistent search panel I rarely need open, my program requirements are buried inside that same panel rather than being front-and-center, and there's no single place that tells me "how close am I to graduating?" — I have to count satisfied requirements myself by mentally scanning accordion contents. The visual design also feels unfinished: cards stretch the full width of their colored background, gradients fight my eyes, an inscrutable numbered "credit ruler" lines the edge of every semester, and there's no consistent design language across the landing page, info pages, auth modals, and the plan view itself.

As a contributor to the codebase, the styling is scattered across 179 inline `style={{...}}` blocks, two competing color systems (`globals.css` with UMN maroon and a stale `theme.ts` referencing the uninstalled Chakra UI library with blue), and inconsistent component patterns that make it hard to make a visual change in one place without making it in twelve.

## Solution

A full UI redesign that flips the desktop layout to put **program requirements** on the left as a primary surface and the **schedule** on the right, moves search into a centered top-bar input (with an inline dropdown), introduces a top-right **global progress** widget that summarizes how close the student is to graduating, restyles every visible surface (plan view, landing, info, auth modals, settings, preview panel, advisor chat) to a single cream-pink-and-maroon design language, and consolidates the design-token system to a single source of truth so future changes propagate cleanly.

Mobile gets a parallel redesign with the same aesthetic but a different interaction model: a collapsible **mobile rail section** above the schedule stack, and a **mobile add picker** replacing touch-drag (which is awkward enough that it actively harms the experience).

The redesign preserves every existing feature — drag-and-drop on desktop, auto-save, plan switching, transcript import, AI Advisor, course preview panels, lock state on planned courses, semester add/remove, hidden-semester management — but re-homes them in the new IA without ceremony.

## User Stories

1. As a student opening my plan, I want my program's **requirements** to be the first thing I see on the left side, so that I can plan my semesters by what I need to satisfy rather than by aimlessly searching the catalog.
2. As a student, I want to drag a **listed course** directly from a requirement row into a semester, so that I don't have to remember the course code and search for it after seeing it in my requirements.
3. As a student, I want a requirement like "Mathematics Core" that needs 4 specific courses to render in **clean mode** as a simple checkbox list of those 4 courses, so that I can see at a glance which ones I've planned.
4. As a student, I want a complex requirement like "any 4 of these 12 courses" to render in **structured mode** with its actual structure (the rule's required count, the candidate set, any sub-rules, any notes), so that I'm not lied to about what the requirement actually demands.
5. As a student, when I plan a course that's listed under multiple requirements (e.g., CSCI 2021 in both Computer Science Core and Technical Electives), I want both rail rows to check, so that I can see all the ways that course contributes to my degree.
6. As a student, I want the top-right "X / Y requirements met" **global progress** widget to count each planned course only once even if it satisfies multiple requirements, so that I can't game the metric by stacking multi-listed courses.
7. As a student planning an **elective** (e.g., MUS 1014) that satisfies no requirement, I want it to sit silently in my schedule without polluting the rail, so that the rail stays focused on what my program demands.
8. As a student adding a course like PHYS 1401V that triggers a **pattern match** rule (e.g., "any natural science lab"), I want the requirement row to show that contribution inline as an italicized "applied via pattern" entry, so that I can see why the requirement is satisfied even without my having dragged a listed course.
9. As a student searching for an elective, I want the top-bar **search dropdown** to be the secondary catalog-browsing surface, so that I don't waste 40% of my screen on a persistent panel when I'm just trying to plan.
10. As a student typing in the search bar, I want results to appear in an inline dropdown beneath the input, so that I can scan results without losing sight of my schedule or rail.
11. As a student, I want to drag a course directly from the search dropdown into a semester, so that the search-as-secondary-add-path still feels fluent.
12. As a student, I want to click a search result (without dragging) to see the **preview panel**, so that I can decide whether to plan the course based on its grade distribution, prerequisites, and description.
13. As a power-user student, I want a Cmd+K keyboard shortcut to open the search input with focus, so that I can add courses without leaving the keyboard.
14. As a student, I want to see my plan title and target program ("Computer Science B.S.") in the **plan header** with a "Saved 2 minutes ago" timestamp, so that I trust my work is being persisted.
15. As a student, I want to click "change" next to my program tag to switch which program my plan targets, so that I can experiment with different majors or minors without losing my work.
16. As a student, I want a top-right "13 / 25 requirements met" widget that gives me a single-glance read on how close I am to graduating, so that I have a vibes-level scoreboard without having to mentally sum every accordion.
17. As a student, I want each schedule card to show only the course code and credit count by default, so that my schedule doesn't drown me in metadata when I'm just trying to see what I'm taking.
18. As a student, I want each schedule card to have a thin colored left **stripe** (department-coded by default) so that I can pattern-match the shape of my schedule at a glance — too much CS this term, no humanities credit yet, etc.
19. As a student, I want the height of each schedule card to scale with its credit count (1-credit courses are thin, 5-credit courses are tall), so that I can see at a glance how my credit load is distributed.
20. As a student, I want to click a schedule card to open its persistent preview panel, and hover to see a temporary preview, so that I can compare courses without committing to a navigation.
21. As a student, I want the schedule to render as a clean two-column grid of semester cards, so that my plan is scannable without horizontal wrap-flow surprises.
22. As a student with a long plan, I want the schedule to scroll independently of the rail, so that I can scan far-future semesters without losing sight of which requirements I'm satisfying.
23. As a student, I want a tiny `+` button after my last semester card to add the next semester (Fall → Spring → Summer → Fall), so that adding a semester is one click without dominating the visual hierarchy.
24. As a student who doesn't take Summer term, I want to right-click an auto-injected empty Summer slot to remove it, so that the auto-injection convenience doesn't clutter my actual plan.
25. As a student whose plan was generated from a transcript upload, I want my historical courses to stay put (not be moved by autofill or accidentally), and I want to see "Locked" status when I open the course's preview panel, so that I understand which courses represent my actual history versus my forward plan.
26. As a student, I want every interaction on my profile, settings, sign-out, and plan-switching to live in a single avatar-circle dropdown in the top-right, so that I have one obvious place to look for "my stuff."
27. As a student on mobile, I want the plan view to reflow into a single column with requirements as a collapsible top-section and the schedule as a stack of semester cards, so that the desktop layout doesn't squash unreadably.
28. As a student on mobile, when I tap a listed course in a requirement row, I want an "Add to which semester?" picker to appear, so that I can add courses without trying to touch-drag (which is genuinely awkward).
29. As a student visiting the landing page or info pages, I want them to share the same cream-pink-and-maroon design language as the plan view, so that the product feels cohesive end-to-end.
30. As a student opening any modal (auth, settings, deletion confirmation), I want it to share the same visual language as the rest of the app, so that nothing feels stitched-together.
31. As a student opening the AI Advisor floating chat, I want it to match the new aesthetic, so that it doesn't look like a Slack window pasted onto a different app.
32. As a student exploring course details, I want the floating preview panel to keep its draggable, multi-pane behavior so that I can compare two courses side-by-side — just restyled to match the new design language.
33. As a returning student who's been away from the app for weeks, I want my plan title, programs, semesters, and saved courses to be exactly where they were before the redesign, so that the visual change doesn't cost me anything in lost state.
34. As a student curious about how the redesign feels before it's live, I want to access a Vercel preview URL of the in-progress redesign, so that I can give feedback before it's the default.
35. As a contributor to the codebase, I want a single source of truth for design tokens (colors, type scale, radii, shadows, spacing) in `globals.css`, so that changing the canvas color is a one-file edit that propagates to every Mantine component, every CSS module, and every Tailwind utility.
36. As a contributor, I want the stale Chakra-referencing `theme.ts` deleted and replaced with a Mantine-shaped `theme.ts` that *consumes* CSS variables from `globals.css`, so that there's no second source of truth that can drift.
37. As a contributor adding a new visual component, I want a clear pattern of "Mantine primitive + CSS module referencing tokens" so that I don't have to wonder whether to use Mantine theming, inline styles, or Tailwind utilities for any given visual choice.
38. As a contributor in the future, I want a "Coming soon" tooltip on the Share button so that I'm not surprised when I find a button wired to nothing, and I understand it's a planned feature being staged for after the redesign.
39. As a future contributor adding dark mode, I want every component to already reference CSS tokens (no raw hex values), so that dark mode is a one-time `:root[data-theme="dark"]` override rather than touching every file again.
40. As the developer shipping this work, I want to finish the in-progress `AI_Advisor` branch and merge it to main before starting the redesign, so that two long-lived branches don't fight over the same files (`PlanDisplay`, `CourseCard`, `DisplaySettings`).
41. As the developer, I want the redesign work to happen in many small atomic PRs against a `redesign-v1` integration branch, so that each step is reviewable by future-me and the integration branch merges to main as one atomic event.
42. As the developer, I want the redesign to start with design-token consolidation (step 1) before any component work, so that no component is restyled twice (once with raw hex, once with tokens).

## Implementation Decisions

### Information architecture (Q1, Q2)

- Desktop plan view layout flips from "search-left (40%) / plan-right (60%)" to "**top bar** / **rail**-left / **schedule**-right". Search moves from a persistent left panel to a centered input in the **top bar**.
- The **rail** is the **primary** drag-source for adding courses to the **schedule**. The top-bar **search dropdown** is the **secondary** path for **electives** and off-requirement courses. Both feed the same drag-and-drop wiring.
- The current dual-`DragDropContext` wiring (search and plan use separate contexts bridged by `window.postMessage`) consolidates to a single `DragDropContext` that wraps both the rail/search dropdown (drag sources) and the schedule (drop target). The `postMessage` bridge in `PlanDisplay.tsx` is removed.

### Requirement rendering (ADR-0001, Q3, Q4)

- A new deep module — the **requirement evaluator** — is introduced. Pure function: takes `programRequisites` (today's `ProgramDetails.requisites` shape) and the plan's planned courses, returns an array of `RequirementProgress` records. Each record carries: the requirement name, the rules tree, the render mode (`clean` | `structured`), per-rule satisfaction state, and per-leaf-course satisfaction state (with the kind of **satisfaction** — **listing** vs **pattern match**).
- A requirement renders in **clean mode** iff every rule in it is a `completeCourses` rule whose leaves are all enumerated course IDs. Anything else renders in **structured mode** (sub-rules with their own headers, `x/y` counts, logical operators, notes). Both share the same outer accordion chrome.
- A planned course can have multiple **satisfactions** (Q4 / 2d). Each affected rail row checks. Drag-target behavior is unchanged whether the course is in zero, one, or many requirements.
- **Pattern matches** (Q4 / 3a) render as italicized "applied via pattern" rows inside `structured`-mode requirements. They are *not* drag-sources — you drag a specific course, not a pattern.
- **Electives** — planned courses with zero satisfactions (Q4 / 4a) — sit only in the **schedule**. The **rail** says nothing about them.

### Progress widget (ADR-0002, Q5)

- A second deep module — the **global progress calculator** — is introduced. Pure function: takes the array of `RequirementProgress` records and the list of planned courses, returns `{ met: number, total: number }`.
- **Slot** semantics: a `completeCourses(n)` rule contributes `n` slots; a `minimumCourses(n)` rule contributes `n` slots; a `minimumCredits` rule contributes **1 binary slot** (1 if the **credit floor** is met, 0 otherwise).
- The global widget is course-deduped: a single course satisfying N requirements moves the widget by 1, not N. Per-requirement rail rows do *not* dedupe (a multi-listed course still checks every box it appears in), so the widget's value will typically be slightly lower than a naive `sum-of-row-x / sum-of-row-y`.
- The widget is presentational only in v1 — no interactivity beyond the static display. Hover-for-breakdown is deferred.

### Component library and theming (ADR-0003, Q6)

- Mantine 8 stays. shadcn/ui migration rejected (33 files touched). Hybrid component-library rejected (doubles surface area).
- A real `theme.ts` is written that *consumes* CSS variables from `globals.css` rather than defining its own values. The stale Chakra-referencing `theme.ts` is deleted.
- The 179 inline `style={{...}}` instances are removed incrementally as each file is touched during the redesign — not as a separate sweep.
- Custom atoms that Mantine doesn't supply (`ProgressRing`, stripe schedule-card skin, global search input) are built bespoke under `components/atoms/` and composed with Mantine primitives.

### Design tokens (ADR-0004, Q13)

- Tokens live in `globals.css` `:root`. Exposed to Tailwind 4 via `@theme inline` and to Mantine via the new `theme.ts`.
- Color tokens: `--bg-canvas: #F8ECE8`, `--bg-surface: #FFFFFF`, `--text-primary: #1A1414`, `--text-secondary: #6B6363`, `--text-tertiary: #A89E9C`, `--accent-primary: #811331`, `--accent-primary-hover: #6A0F28`, `--success: #1F8B4C`, `--border-subtle: #E8DCD9`.
- Department-stripe palette (consumed by the **course color resolver**): CSCI/MATH `#811331`, humanities (MUS/HSEM) `#D49A2E`, sciences (PHYS/CHEM/BIOL/PSY) `#B97250`, neutral fallback `#A89E9C`. Four-bucket starting taxonomy; will iterate.
- Type tokens: micro 11px (uppercase labels), body 14px, label 16px, title 32px. Font is Geist sans.
- Radii: 4px (rail rows), 8px (cards), 12px (modals), 999px (search input, share button, program tag pill).
- Shadows: a single `--shadow-card` and a `--shadow-overlay` for floating surfaces.
- Spacing: 8px grid (`--space-1` through `--space-12`).
- Dark mode is deferred to post-v1; token system is structured so dark mode is a one-time `:root[data-theme="dark"]` override.

### Top bar and plan header (Q10)

- **Top bar** is plan-view-specific (`/plan/[planId]` only). Landing and info pages keep their own headers.
- Top bar contents: `planu.mn` logo (left), centered search input, Share button (right), avatar dropdown (far right).
- Avatar dropdown contents: switch plan, my plans, settings, sign out. Signed-out: avatar becomes a "Sign in" button.
- **Share button is rendered with a "Coming soon" tooltip in v1; feature itself is deferred.** No `share_token`, no public-read endpoint, no viewer experience in this PRD.
- **Plan header** sits below the top bar: inline-editable title, program tag with a `change ▾` switcher (Mantine Menu/Combobox of available programs), saved-status timestamp, and the **global progress** widget aligned to the right edge of the same row.

### Schedule (Q8, Q9)

- 2-column CSS grid. Responsive: 2-col above 900px, 1-col below.
- The credit ruler (numbered 1-N column on the left edge of every semester) is **removed entirely**.
- Each semester card has a header showing the semester label and a `X CR` total.
- The × per-semester-remove button is removed; semester removal moves to a right-click context menu, preserving "confirm if non-empty".
- A small `+` button (60% opacity, brightens on hover) sits after the last visible semester card to add the next semester (Fall → Spring → Summer → Fall walker).
- Auto-injection of an empty Summer for every Spring is preserved.
- Schedule course cards: white background, 4px department-coded left **stripe** (driven by `ColorKey`), credit-driven height (`cred * 20px`), course code + credits visible at rest. Drag handles invisible; whole card is a drag source on hover.
- **Lock state has zero on-card affordance.** Lock status and lock-toggle live in the **preview panel** only.
- Click → persistent preview; hover → temporary preview. `PreviewContext` semantics unchanged.

### Rail (Q3, Q4)

- Left column of the desktop plan view, independently scrollable from the schedule.
- Renders each `RequirementProgress` as an accordion item with: progress ring/circle (left), requirement name, `x/y` count (right).
- **Clean mode**: expanded item shows a flat list of checkbox rows, one per listed course; each row is a drag source.
- **Structured mode**: expanded item shows sub-rules with their own headers, `x/y` counts, logical operators ("any 4 of"), notes, and a mix of listed-course rows (draggable) and pattern-match rows (italicized, non-draggable).

### Search dropdown (Q7)

- Top-bar search input opens an inline dropdown beneath itself when the user types. Empty focused state: no dropdown opens.
- Result rows are compact (course code + title + credits), drawn from `CourseStub` shape via `/api/search`.
- Whole-row drag source; click without drag opens the **preview panel**.
- Cmd+K (Cmd on Mac, Ctrl on Windows/Linux) accelerator opens the search input with focus.
- Dropdown stays open during an in-progress drag (hook into `onDragStart` to suppress close-on-blur).
- "See all results" full-overlay is not in scope for v1.

### Mobile (Q11)

- Mobile (`< 768px`) keeps a separate `PlanDisplayMobile` component, redesigned in parallel.
- Layout: top bar (logo, search input, avatar — Share button hidden), **mobile rail section** above schedule, schedule as a single-column stack.
- The **mobile rail section** is a collapsible top accordion holding all requirements, defaulting to collapsed.
- Mobile drag-as-add is **dropped**. Tapping a listed course in the mobile rail section or a result in the search dropdown opens the **mobile add picker**: a Mantine Menu of available semesters; tapping a semester commits the add.
- The interaction model intentionally diverges between desktop (drag) and mobile (click-to-add).

### Non-plan surfaces (Q12)

- Landing page (`/`): full redesign adopting the new aesthetic.
- Info pages (`/info/contact`, `/info/privacy`): typography + palette pass only, no layout changes.
- `AuthenticationModal`: full restyle.
- `SettingsModal`: stays a modal (no drawer or route conversion), restyled. Contents (ColorKey toggle, hidden semesters management) unchanged.
- `ProfileDropdown`: restyle only.
- `DeletionConfirmationModal`: inherits new auth-modal language.
- **Preview panel** (`CoursePreviewPanel`): restyle only. Keeps floating + draggable + multi-pane semantics.
- `AdvisorChat`: restyle only. Fixed floating position unchanged.

### Delivery (Q14)

- `AI_Advisor` branch finishes and merges to main *before* the redesign starts.
- Redesign work happens on a new branch `redesign-v1` cut from main after `AI_Advisor` lands.
- Many small atomic PRs are merged to `redesign-v1`. The integration branch merges to main as one atomic event when feature-complete.
- Vercel previews provide the side-by-side staging; no production feature flag.
- Sequencing inside `redesign-v1`:
  1. Token consolidation (`globals.css` rewrite, delete stale `theme.ts`, raw-hex → token replacements)
  2. New Mantine `theme.ts` consuming tokens, applied at `client-layout.tsx`
  3. Layout shell — new top bar, plan header, rail/schedule grid skeleton (placeholder content)
  4. Schedule restyle — new `CourseCard` with stripe, 2-col grid, DnD consolidation, `+` add button, drop credit ruler
  5. Rail — `Requirement` component with clean/structured modes, drag source wiring; ship the **requirement evaluator** and **global progress calculator**
  6. Search dropdown in top bar
  7. Preview panel restyle
  8. Settings modal + ProfileDropdown + DeletionConfirmationModal restyle
  9. Auth modals restyle
  10. Landing page redesign + info page typography pass
  11. AdvisorChat restyle
  12. Mobile rewrite (`PlanDisplayMobile`, `MobileRailSection`, `MobileAddPicker`, click-to-add picker)
  13. Cmd+K accelerator (polish; only if time)

## Testing Decisions

### What makes a good test in this context

- Tests target the **deep modules** — pure functions with simple input/output contracts — not React components, not visual rendering.
- Tests assert on external behavior — what the module returns for a given input — never on how the module computes it internally. A test that breaks when an internal helper is renamed is not a good test.
- Cover edge cases that ADRs explicitly call out, because those are most likely to silently regress (multi-satisfaction, credit-rule binary semantics, render-mode boundary between clean and structured).
- Use realistic fixtures: a handful of `ReqGroup`-shaped inputs that look like actual CourseDog data (one all-`completeCourses`, one `minimumCourses` with extra candidates, one `minimumCredits`, one with sub-rules, one with pattern leaves).

### Modules to test

1. **Requirement evaluator.** Test cases:
   - A group with only `completeCourses` rules renders in `clean` mode; the same group with one `minimumCourses` rule renders in `structured` mode.
   - A `completeCourses(5)` rule reports 5 slots; satisfying 3 enumerated courses yields `3/5`.
   - A `minimumCourses(4)` rule with 12 candidates reports 4 slots (not 12); satisfying 4+ candidates caps at `4/4`.
   - A `minimumCredits(8)` rule reports 1 binary slot; satisfying 5 credits yields `0/1`; satisfying 9 yields `1/1`.
   - A pattern leaf matches a planned course not enumerated in any rule and surfaces as a pattern satisfaction (not a listed satisfaction).
   - A planned course listed in two different requirements appears in both `RequirementProgress` records' satisfaction maps.

2. **Global progress calculator.** Test cases:
   - Given a set of `RequirementProgress` records totaling 25 slots with the mockup's 13/25 numerator situation but no multi-satisfied courses, returns `{ met: 13, total: 25 }`.
   - Given the same situation where one planned course satisfies 2 different requirements, the global widget returns `{ met: 12, total: 25 }` — dedupe is visible.
   - Given a `minimumCredits` rule with credit floor 8 and the plan has 6 credits matching, the widget contributes `0/1` for that rule; with 9 credits matching, it contributes `1/1`.
   - Adding an elective (zero satisfactions) does not change `met` or `total`.

3. **Course color resolver** — no tests requested. Mapping is a small switch statement; typos will be caught by eyeballing the schedule.

### Test setup

- The project has **zero tests** today. Setting up Vitest (matches the existing Vite-flavored Next.js build) is the natural minimal choice. No React Testing Library is needed for the two deep modules (both pure functions).
- Fixtures live in a `__fixtures__/` directory next to the modules. Each fixture is a small TypeScript file producing a realistic `ProgramDetails`-shaped object; these double as living documentation of the data shape.
- No prior art in the codebase. Establish the pattern minimally; resist over-engineering the test setup.

## Out of Scope

- **Sharing feature.** The Share button ships disabled with a "Coming soon" tooltip. Token model, public-read endpoint, RLS policy changes, viewer-experience, fork-to-my-account flow all deferred.
- **AI Advisor functional changes.** Only a visual restyle. Conversation flows, model selection, system prompts unchanged.
- **Catalog browsing experience.** A dedicated catalog-browsing surface is out of scope. The search dropdown handles "I know roughly what I want"; "let me wander the catalog" is poorly served in v1.
- **Dark mode.** Token system is structured for it; not delivered.
- **Cmd+K beyond the search accelerator.** Full command palette not in scope.
- **Cross-cutting accessibility audit.** WCAG AA is the loose target; Mantine's built-in keyboard handlers cover common cases. A formal accessibility audit is a follow-up.
- **Empty / loading / error state design.** Addressed inline during implementation rather than pre-specified here.
- **Curated requirements rail.** The future option of hand-authored or LLM-generated per-program "happy path" simplifications is rejected for v1.
- **Test coverage beyond the two deep modules.** Visual components validated by manual testing on the Vercel preview.
- **Catalog year handling.** No changes to how catalog years are selected.
- **Performance optimization for very large plans.** Standard 4-year plans are the upper bound we'll test against.

## Further Notes

- This PRD is the output of a `/grill-with-docs` session that resolved 14 design questions and produced 4 ADRs in `docs/adr/0001-0004-*.md` and a full `CONTEXT.md` glossary. **Implementation must respect those decisions and use the glossary's terminology consistently** — particularly the distinction between **requirement** (UI concept, rail item) and `ReqGroup` (data-model term, code-only), and between **satisfaction** (a course contributing to a requirement) and **planning** (placing a course in a semester).
- The current `AI_Advisor` branch is mid-feature with uncommitted changes touching `PlanDisplay`, `CourseCard`, `DisplaySettings`, and `PlanDisplayMobile` — exactly the files the redesign rewrites. **The sequencing decision (finish `AI_Advisor` first, then branch redesign off stable main) is essential** to avoid a multi-week merge conflict swamp.
- The progress widget formula (ADR-0002) means the mockup's exact `13/25` value would resolve to a slightly lower number with real dedupe applied. This is acceptable; the mockup is a design illustration, not a contract on the displayed value.
- The department-stripe palette has only four buckets in v1. Real University of Minnesota departments include many more disciplines that will eventually need their own bucket assignment — Engineering subspecialties, Languages, Arts, Business, Education, Nursing, etc. Iterate as real plans surface visual issues.
- Three gaps were called out at the end of the grilling session but not resolved: a formal accessibility commitment, the design of empty/loading/error states, and the disabled-state design for the Share button. None block starting implementation, but they should be revisited before the surfaces they affect ship.
