# Slice 11: Mobile rewrite (PlanDisplayMobile + MobileRailSection + MobileAddPicker)

Status: ready-for-human

## Parent

[`../PRD.md`](../PRD.md)

## What to build

Mobile (`< 768px`) gets a parallel redesign matching the new aesthetic but with a deliberately divergent interaction model: **click-to-add replaces touch-drag** because touch-drag with `@hello-pangea/dnd` is awkward enough to actively harm the experience.

### Layout

- Top bar: logo (smaller), centered search input, avatar dropdown. **Share button hidden on mobile.**
- **Mobile rail section**: a collapsible top-section accordion that holds all requirements, defaulting to collapsed
- Schedule: single-column stack of semester cards

### Add flow

- Tap a listed course in the mobile rail section → **mobile add picker** opens: a Mantine Menu of available semesters; tapping a semester commits the add
- Tap a result in the top-bar search dropdown → same picker opens

### Why HITL (ready-for-human)

The desktop→mobile interaction model intentionally diverges (drag → tap). Touch UX is highly variable across devices and requires real-device testing — at minimum iOS Safari and Android Chrome at multiple viewport widths. A design review of the mobile flow before merging is required.

### Reuses

- **Requirement evaluator** and **global progress calculator** from Slice 4 (mobile rail consumes the same `RequirementProgress[]` shape)
- Token system from Slice 1
- `PreviewContext` (tap a card to open preview; mobile preview UX may need adjustment but defer if non-blocking)

## Acceptance criteria

- [ ] Below 768px viewport, `PlanDisplayMobile` renders instead of `PlanDisplayDesktop`
- [ ] Top bar shows logo + search + avatar (Share button hidden)
- [ ] Mobile rail section is a collapsible accordion at the top of the page, defaulting to collapsed
- [ ] Tapping a listed course inside the mobile rail section opens the mobile add picker
- [ ] Tapping a search result on mobile opens the mobile add picker
- [ ] Picker shows available semesters; tapping a semester commits the add and closes the picker
- [ ] Schedule renders as a single-column stack of semester cards (with the new visual treatment)
- [ ] Drag is NOT a supported add gesture on mobile (touch drag from rail/search does not produce a drop)
- [ ] Tested manually on at least iOS Safari and Android Chrome
- [ ] Tested at iPhone SE, iPhone 14, and tablet portrait widths
- [ ] No regression in plan persistence

## Blocked by

- [`04-rail-and-deep-modules.md`](./04-rail-and-deep-modules.md)
