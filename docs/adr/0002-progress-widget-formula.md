# Progress widget: deduped slot sum, credit rules as binary slots

The headline `13/25` widget needs a single formula that works across `completeCourses`, `minimumCourses`, and `minimumCredits` rules, and that handles courses satisfying multiple requirements. We compute it as the sum of per-requirement slot counts, **deduped by planned course** at the global level. `completeCourses` and `minimumCourses` rules expose `n` slots each (one per required course). `minimumCredits` rules expose **one binary slot** — `1/1` once the credit floor is met, `0/1` otherwise. Per-requirement rail rows do *not* dedupe (a multi-listed course still checks every box it appears in); only the global widget does.

## Considered Options

- **Slot-ify credit rules by converting credits to slots** (`ceil(8 cr / 3 cr-per-course) = 3 slots`). Rejected: rounds lies into the headline ("3/3 met" when actually 7/8 credits earned).
- **Credit rules contribute a credit bar to the headline** (`"13/25 reqs + 22/30 cr"`). Rejected: doubles the headline's cognitive load and creates two scoreboards.
- **No widget dedupe — sum per-requirement slot counts straight.** Rejected: a course listed in N requirements would inflate the widget by N, letting students game the metric by picking multi-listed courses.
- **Per-requirement dedupe too** (a multi-listed course picks one home requirement and only that rail row checks). Rejected: makes the rail less honest — a student looking at "Technical Electives" wouldn't see that CSCI 2021 contributed there even though it did.

## Consequences

- The widget value will typically be lower than a "naive sum of x / sum of y" over the rail's visible counts, because multi-listed courses are counted once globally and N times per-rail. The mockup's `13/25` would resolve to a lower number under real dedupe and is treated as illustrative.
- Returning users get used to the widget value; changing the formula later would shift everyone's displayed progress with no real change in their plan. Any future revision (e.g., introducing weighted slots) should be a deliberate, communicated change, not a silent fix.
- Credit-rule rail rows in `structured` mode may still surface their own granular `X cr / Y cr` indicator so students can see partial progress; that detail lives in the rail, not the headline.
