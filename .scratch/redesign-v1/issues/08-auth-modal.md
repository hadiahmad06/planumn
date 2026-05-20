# Slice 8: Auth modal restyle

Status: ready-for-agent

## Parent

[`../PRD.md`](../PRD.md)

## What to build

Restyle `AuthenticationModal` (sign in + sign up flows) to match the new design language. Form inputs adopt the new token system. No functional changes — Supabase auth flow, validation logic, and routing remain identical.

This is an independent restyle slice that only depends on tokens being in place.

## Acceptance criteria

- [ ] Modal background, padding, radii match `--radius-lg` and other tokens
- [ ] Form inputs (email, password) use new token-driven styling
- [ ] Primary action buttons use `--accent-primary`
- [ ] Modal closes/opens with same triggers as today
- [ ] Sign in succeeds and redirects identically to today
- [ ] Sign up succeeds and creates account identically to today
- [ ] Visible on Vercel preview at the redesign branch

## Blocked by

- [`01-design-tokens.md`](./01-design-tokens.md)
