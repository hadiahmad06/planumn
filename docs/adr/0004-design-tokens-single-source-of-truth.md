# Design tokens: `globals.css` is the source of truth; everything consumes from it

The codebase currently has two competing color systems — `frontend/src/app/globals.css` (UMN maroon `#7A0019`) and `frontend/src/styles/theme.ts` (stale blue `#007BFF`, references the uninstalled Chakra UI library) — plus inline values like `#811331` scattered across components. As part of the redesign we consolidate: design tokens (color, type, radii, shadows, spacing) live in `globals.css` `:root`, exposed to Tailwind 4 via `@theme inline` and to Mantine via a new `theme.ts` that *consumes* those CSS vars rather than redefining them. CSS modules reference via `var(--token-name)`. The stale Chakra-referencing `theme.ts` is deleted; a fresh Mantine-shaped `theme.ts` replaces it.

## Considered Options

- **Mantine `theme.ts` as the source of truth.** Mantine's `MantineTheme` becomes canonical; Tailwind config and CSS modules pull from it via generated CSS vars. Rejected: Tailwind 4 wants CSS vars as the primary source, not generated downstream; and CSS modules can't easily reach a JS-defined Mantine theme object.
- **Two parallel sources kept in sync manually.** Rejected: this is exactly the state we're consolidating away from. Drift is inevitable.
- **Tailwind `tailwind.config.js` as the source.** Rejected: Tailwind 4 deprecates the JS config in favor of `@theme inline` directives in CSS, which means CSS becomes the source anyway.

## Consequences

- Every Mantine-themed component, every CSS module, every Tailwind utility class, and every inline style references the same token. Changing a token value (e.g., the canvas color) is a one-file edit that propagates everywhere.
- New components must reference tokens, not raw hex values. The "no raw hex outside `globals.css`" rule should be enforced via lint or code review; otherwise the consolidation degrades over the next quarter.
- Dark mode is deferred (post-v1). When it ships, it will be a second `:root[data-theme="dark"]` block overriding the same token names — no component code changes needed if everyone is referencing tokens correctly. If components have raw hex values baked in, dark mode forces a second migration.
- The department-stripe palette (used by `getCourseColor` for `ColorKey: "department"`) is a four-bucket starting taxonomy (CS/MATH maroon, humanities mustard, sciences tan, other neutral). Will need iteration as the catalog covers more departments.
