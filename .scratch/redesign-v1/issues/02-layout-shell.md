# Slice 2: Layout shell (top bar + plan header + rail/schedule skeleton)

Status: ready-for-agent

## Parent

[`../PRD.md`](../PRD.md)

## What to build

The new IA's structural skeleton, with placeholder content where the rail and schedule will live. Visible end-to-end on `/plan/[planId]`: students see the new top bar, the plan header, and the rail-left / schedule-right grid — but the rail and schedule are still placeholder boxes (real content lands in Slices 3-5).

Consolidate the dual-`DragDropContext` wiring (today's `SearchLayout` and `PlanDisplay` use separate contexts bridged by `window.postMessage`) into a single `DragDropContext` that wraps both rail/search and schedule. Remove the `postMessage` bridge from `PlanDisplay.tsx`.

### Top bar contents

- `planu.mn` logo (left)
- Centered search input (placeholder behavior — no dropdown yet)
- "Share" button (right, **rendered as disabled with "Coming soon" tooltip** per Q10-b-i)
- Avatar dropdown (far right): switch plan, my plans, settings, sign out. Signed-out: button reads "Sign in"

### Plan header (below top bar)

- Inline-editable plan title
- Program tag with `change ▾` switcher (placeholder — opens a Mantine `Menu`/`Combobox`)
- Saved-status timestamp (e.g., "Saved 2 minutes ago", `dayjs`-formatted)
- Global progress widget on right (static placeholder: shows "—/—" until Slice 4 ships the calculator)

### Rail + schedule skeleton

- Two-column layout: rail (left), schedule (right)
- Both independently scrollable
- Rail and schedule contain placeholder boxes for now

## Acceptance criteria

- [ ] Top bar visible on every `/plan/[planId]` route
- [ ] Share button shows "Coming soon" tooltip on hover, disabled state
- [ ] Avatar dropdown shows expected items per Q10
- [ ] Plan title is inline-editable (typing updates the title in PlanProvider, auto-save fires)
- [ ] Saved-status text updates as plan changes
- [ ] Rail and schedule render side-by-side with independent scroll
- [ ] Single `DragDropContext` wraps the page; `postMessage` bridge removed from `PlanDisplay.tsx`
- [ ] Old search-left/plan-right layout is gone
- [ ] No regression in plan persistence (saves still work)

## Blocked by

- [`01-design-tokens.md`](./01-design-tokens.md)
