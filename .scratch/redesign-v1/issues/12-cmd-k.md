# Slice 12: Cmd+K accelerator for search

Status: ready-for-agent

## Parent

[`../PRD.md`](../PRD.md)

## What to build

Polish slice — add a Cmd+K (Mac) / Ctrl+K (Windows/Linux) keyboard shortcut that focuses the top-bar search input.

This is the *only* command-palette behavior in scope for v1. Full command palette (jump to plan, switch program, open settings, etc.) is explicitly out of scope per PRD.

Ship only if there's time after the rest of the redesign lands.

## Acceptance criteria

- [ ] Pressing Cmd+K on macOS focuses the top-bar search input
- [ ] Pressing Ctrl+K on Windows/Linux focuses the top-bar search input
- [ ] Shortcut works on `/plan/[planId]` (the only route where the top-bar search exists)
- [ ] Default browser handling for Cmd+K is suppressed when the shortcut fires
- [ ] No conflict with other keyboard shortcuts in the app
- [ ] No regression in any search behavior

## Blocked by

- [`05-search-dropdown.md`](./05-search-dropdown.md)
