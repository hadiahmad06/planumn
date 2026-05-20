# Slice 6: Preview panel restyle (with lock state UI)

Status: ready-for-agent

## Parent

[`../PRD.md`](../PRD.md)

## What to build

Restyle `CoursePreviewPanel` (and the underlying `CoursePreview` molecule) to match the new design language. The panel keeps its floating, draggable, multi-pane semantics — students can open two previews side-by-side to compare courses.

**This slice is the sole home for the lock-state UI** per the redesign decision (Q8 / 8c-ii). The schedule card is silent about lock state; if students want to see whether a course is `locked` / `unlocked` / `autofilled`, they click the card → preview panel → labeled badge in the panel. Lock-toggle action also lives here.

## Acceptance criteria

- [ ] Panel background, padding, radii, shadow use new tokens
- [ ] Course code, title, credits, description render with new typography
- [ ] Grade distribution chart restyled to match the palette
- [ ] Lock state badge visible: "Locked", "Autofilled", or no badge for `unlocked`
- [ ] Lock-toggle action available in the panel (preserves today's `togglePlannedCourseLock` behavior)
- [ ] Multi-pane behavior preserved (open second preview without closing first)
- [ ] Drag to reposition still works
- [ ] Pointer-enter on a schedule or rail card still opens a temporary preview
- [ ] Click on a schedule or rail card still opens a persistent preview
- [ ] `PreviewContext` semantics unchanged

## Blocked by

- [`02-layout-shell.md`](./02-layout-shell.md)
