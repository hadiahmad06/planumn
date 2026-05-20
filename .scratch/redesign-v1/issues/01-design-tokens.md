# Slice 1: Design tokens + Mantine theme consolidation

Status: ready-for-agent

## Parent

[`../PRD.md`](../PRD.md)

## What to build

Consolidate every design token (color, typography, radii, shadows, spacing) into a single source of truth in `globals.css` `:root`. Expose them to Tailwind 4 via `@theme inline` and to Mantine via a new `theme.ts` that *consumes* the CSS variables rather than redefining them. Delete the stale Chakra-referencing `theme.ts`. Sweep the codebase to replace raw hex values with token references.

After this slice, the existing UI subtly shifts to match the new palette and typography even though no layout work has happened yet. This is the foundation per ADR-0004; every later slice binds to these tokens.

Token values are specified in the PRD (Implementation Decisions → Design tokens).

## Acceptance criteria

- [ ] `globals.css` `:root` defines all tokens from the PRD spec (canvas, surface, text, accent, success, border, department-stripe palette, type sizes, radii, shadows, 8px spacing scale)
- [ ] Tailwind 4 `@theme inline` block exposes the same tokens for Tailwind utility usage
- [ ] New `frontend/src/styles/theme.ts` is a Mantine `MantineTheme` that reads from CSS vars (no duplicated literal values)
- [ ] Old `frontend/src/styles/theme.ts` (Chakra-referencing) is deleted
- [ ] All raw hex values in `.tsx` files outside `globals.css` are replaced with token references (`var(--...)` or Mantine `theme.colors.*`)
- [ ] App still renders without visual regression beyond the intended palette/typography shift
- [ ] Mantine `theme.ts` is wired in at `client-layout.tsx`

## Blocked by

None — can start immediately.
