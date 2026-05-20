# Requirements rail renders in two modes, not one

The program-requirements rail needs to display CourseDog `ReqGroup`s whose shape ranges from "complete all 5 of these named courses" to "any 4 of these 12 OR one of these tracks, with at least one upper-division writing-intensive." We render each requirement in one of two modes: `clean` (mockup-style flat list of draggable checkbox rows, used only when every rule in the requirement is a `completeCourses` rule with fully enumerated leaves) or `structured` (sub-rules rendered with their own headers, `x/y` counts, logical operators, and notes — used for everything else). Both modes share the same outer chrome so the rail still feels uniform.

## Considered Options

- **Lossless restyle.** Render the full recursive `ReqRule` / `ReqCondition` / `ReqValue` tree for every requirement, just cleaner than today. Rejected: throws away the visual win of the mockup even for the cases where the data is genuinely simple.
- **Aggressive flatten.** Always show a flat list of leaf course IDs with a single `x/y`. Rejected: silently misrepresents requirements like "any 4 of these 12" (the user can't tell which 4 satisfy which sub-rule), which is worse than today's messy-but-honest tree. A student trusting the simplification could miss graduation.
- **Curated rail.** Hand-authored or LLM-generated per-program simplifications, with the real requisite tree behind a "see full requirements" button. Rejected for v1: adds a curation burden and divergence risk (curated list drifts from actual requirements). Worth revisiting later.

## Consequences

- The rail's visual uniformity is preserved at the chrome level but broken at the row level — complex requirements will look noticeably busier than the mockup's all-`clean` example. Designer has explicitly accepted this.
- Anything that consumes "requirement progress" (the rail's `x/y`, the top-right progress widget) needs a per-rule progress calculation that works in both modes, not a flat-list count.
- The drag-source set is exactly the **listed courses** under `clean`-mode requirements, plus any enumerated leaves in `structured`-mode requirements. Non-enumerable leaves (patterns like "any 3000+ CSCI") are never drag-sources.
