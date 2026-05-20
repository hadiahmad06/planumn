# Slice 7: Settings + Profile + Deletion modal restyles

Status: ready-for-agent

## Parent

[`../PRD.md`](../PRD.md)

## What to build

Three closely-related restyles bundled because they share the same modal/dropdown visual language:

1. **`SettingsModal`** — stays a modal (no conversion to drawer or `/settings` route per Q12-d-i). Restyled to new tokens. Contents unchanged: `ColorKey` toggle, hidden semesters management.
2. **`ProfileDropdown`** — already exists, matches the mockup's avatar pattern. Restyle the dropdown surface itself and its items. Confirm contents match Q10-a: switch plan, my plans, settings, sign out (signed-out: "Sign in" button replaces the dropdown).
3. **`DeletionConfirmationModal`** — restyle to inherit the same modal language as auth and settings.

## Acceptance criteria

- [ ] Settings modal background, padding, radii match new tokens
- [ ] ColorKey toggle still updates `DisplaySettingsContext` correctly
- [ ] Hidden semesters management still adds/removes hidden semester IDs correctly
- [ ] Profile dropdown styled with new design language
- [ ] Avatar dropdown items: switch plan, my plans, settings, sign out (and "Sign in" replacement when logged out)
- [ ] Deletion confirmation modal styled consistently with auth and settings modals
- [ ] All three surfaces close/open with same triggers as today
- [ ] No functional regressions in any of the three

## Blocked by

- [`02-layout-shell.md`](./02-layout-shell.md)
