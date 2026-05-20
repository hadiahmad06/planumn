# Slice 3: Schedule restyle (CourseCard with stripe, 2-col grid, semester management)

Status: ready-for-agent

## Parent

[`../PRD.md`](../PRD.md)

## What to build

Real semester cards in a 2-col responsive grid, real schedule course cards with the new visual treatment. After this slice, the schedule is fully demoable end-to-end: drag courses around within the schedule, save, see total credits per semester, click cards to open the preview panel, add/remove semesters.

### Schedule layout

- 2-column CSS grid (responsive: 2-col above 900px, 1-col below)
- Each semester card has a header showing the semester label (e.g. "Fall 2024") and an `X CR` total
- **Drop the credit ruler entirely** (the numbered 1-N column on the left edge of every semester is removed)
- The × per-semester-remove button is gone — semester removal moves to a right-click context menu, preserving today's "confirm if non-empty" guard
- Small `+` button (60% opacity, brightens on hover) sits after the last visible semester card to add the next semester (Fall → Spring → Summer → Fall walker)
- Summer auto-injection (today's `useEffect` keyed on `plan.id`) is preserved

### Schedule course cards

- White background, 4px department-coded left **stripe** (driven by `ColorKey` setting)
- Credit-driven height (`cred * 20px`, multiplier token-driven not hardcoded)
- Visible at rest: course code + credit count
- Drag handles invisible; whole card is a drag source on hover
- **Lock state has zero on-card affordance** (lock UI lives in preview panel only — Slice 6)
- Click → opens persistent preview; hover → opens temporary preview (`PreviewContext` unchanged)

### Other

- Extend the **course color resolver** (today's `getCourseColor`) with the new four-bucket department palette: CSCI/MATH maroon `#811331`, humanities (MUS/HSEM) mustard `#D49A2E`, sciences (PHYS/CHEM/BIOL/PSY) tan `#B97250`, neutral fallback `#A89E9C`. No tests requested for this module.

## Acceptance criteria

- [ ] Schedule renders as a 2-col CSS grid; reflows to 1-col below 900px
- [ ] Each semester card has new header (label + `X CR` total) and white background
- [ ] Credit ruler is removed from every semester card
- [ ] `+` button at end of schedule adds the next semester via Fall → Spring → Summer → Fall walker
- [ ] Right-click on a semester card opens "Remove semester" menu; confirms if non-empty
- [ ] Summer auto-injection still adds an empty Summer for every Spring on plan load
- [ ] `CourseCard` renders with white bg + 4px stripe (department-coded by default)
- [ ] Card height scales with course's `cred_min`
- [ ] Drag a course within the schedule (one semester → another) works, plan auto-saves
- [ ] Click → persistent preview; hover → temporary preview
- [ ] No lock-state indicator visible on the card itself (silent at rest and on hover)
- [ ] Course color resolver supports the four department-stripe buckets

## Blocked by

- [`02-layout-shell.md`](./02-layout-shell.md)
