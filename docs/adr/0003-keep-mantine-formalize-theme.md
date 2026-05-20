# Keep Mantine; chase the new aesthetic via a real theme, not a library swap

The UI redesign moves us toward a custom, minimalist aesthetic that doesn't look like Mantine's defaults, which prompted "should we switch to shadcn/ui?" We're keeping Mantine and reaching the new look by formalizing `theme.ts` (tokens for color, type scale, radii, shadows, spacing), exposing the same tokens as CSS custom properties for Tailwind/CSS-modules consumers, and replacing inline `style={{...}}` (179 occurrences across the codebase) with theme-token references as each file gets touched during the redesign. Custom atoms that Mantine doesn't supply (progress ring, schedule course-card skin, global search input) are built bespoke and composed with Mantine primitives.

## Considered Options

- **Replace Mantine with shadcn/ui (Radix + Tailwind).** Closer to the mockup's aesthetic out of the box. Rejected: 33 files import from `@mantine/core` — `Accordion`, `ScrollArea`, `Menu`, `Portal`, `MultiSelect`, etc. Migrating during a redesign that already touches IA, drag flow, requirement rendering, and progress math turns a multi-week project into a quarter and adds real regression risk to interaction-heavy surfaces.
- **Hybrid: keep Mantine primitives, swap visual atoms for bespoke Tailwind components.** Rejected: every new screen forces an "is this the Mantine Button or the custom Button?" decision; doubles the component surface area, the bundle, and the accessibility surface. Cost compounds with every new contributor.

## Consequences

- The redesign tactically touches ~33 files; inline-style cleanup happens incrementally as each file is restyled, not as a separate sweep.
- The mockup's aesthetic depends on consistent token use across the app — partial migration (some files theme-driven, others still inline-styled) will visibly fragment the design. Acceptable mid-rollout but should be tracked, not normalized.
- Anything Mantine doesn't supply (progress ring, schedule course-card skin, global search input) becomes a bespoke atom under `components/atoms/`. These need a clear pattern so they don't drift from Mantine primitives' API conventions (`size`, `radius`, `variant` props).
