# Slice 9: Landing page redesign + info pages typography pass

Status: ready-for-agent

## Parent

[`../PRD.md`](../PRD.md)

## What to build

Two related but distinct redesigns:

1. **Landing page (`/`)** — full redesign adopting the cream-pink-and-maroon aesthetic. New hero, restyled `LoggedInLandingButtons` / `LoggedOutLandingButtons`, consistent design language with the in-app plan view.
2. **Info pages (`/info/contact`, `/info/privacy`)** — typography + palette pass only. No layout changes. Text-heavy pages should feel like the same product.

Landing page is a student's first impression after Supabase auth or arriving fresh. It must match the new aesthetic, or the redesign feels half-finished from minute one.

## Acceptance criteria

- [ ] Landing page uses `--bg-canvas`, new typography, primary maroon accents
- [ ] Both logged-in and logged-out CTAs styled consistently with new design language
- [ ] `/info/contact` text content rendered with new type scale and palette
- [ ] `/info/privacy` text content rendered with new type scale and palette
- [ ] No layout changes to info pages — just visual tokens
- [ ] All three pages render without errors at standard viewport sizes
- [ ] Visible on Vercel preview

## Blocked by

- [`01-design-tokens.md`](./01-design-tokens.md)
