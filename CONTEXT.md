# planu.mn

A graduation planner for University of Minnesota students. Users drag courses into semester slots to build a multi-year plan that satisfies their program's requirements.

## Language

### Plan

**Plan**:
A multi-year, ordered sequence of **semesters**, each holding zero or more **planned courses**. Belongs to one user and targets one or more **programs**.
_Avoid_: Schedule (we use that word for the right-hand grid surface in the UI), curriculum

**Semester**:
A single term slot (Fall / Spring / Summer of a specific year) that holds **planned courses**.

**Planned course**:
A course as it sits inside a **plan** — has a parent **semester**, a lock state (`locked` / `unlocked` / `autofilled`), and a reference to the underlying course's `id`. Distinct from the catalog-level `CourseDetails`.

### Programs and Requirements

**Program**:
A degree, major, or minor a student is pursuing (e.g. "Computer Science B.S."). One **plan** can target multiple programs.

**Requirement**:
A single accordion-row in the program-requirements rail (e.g. "Mathematics Core", "Computer Science Core"). Maps 1-to-1 to a `ReqGroup` in the code/API. Has a name, a progress count (`x/y`), and one or more underlying **rules**.
_Avoid_: Requisite, requirement group (these are the data-model names — use them in code, not in product/UX conversation)

**Rule**:
The atomic unit inside a **requirement** — one `ReqRule` in code. Has a `condition` like `completeCourses` ("all of these"), `minimumCourses` ("any N of these"), or `minimumCredits` ("N credits worth of these"), plus the leaf set of course IDs or patterns it applies to.

**Listed course**:
A course that appears explicitly by ID in a rule's leaf set, making it eligible to be a checkbox row in the rail and a drag-source for the schedule. Distinct from non-enumerable leaves (e.g. "any 3000+ CSCI") which can't be listed.

**Render mode** (of a **requirement**):
Either `clean` (the mockup-style flat list of checkbox rows, used when every rule in the requirement is a `completeCourses` rule with all-enumerated leaves) or `structured` (sub-rules rendered with their own headers, `x/y` counts, and logical operators — used for any requirement that doesn't qualify for `clean`). See ADR-0001.

**Satisfaction**:
A many-to-many link between a **planned course** and a **requirement** — the *fact that* a course in the plan contributes to a requirement. One planned course can satisfy multiple requirements simultaneously (its rail row checks under each); each satisfaction renders as a checked rail row but the global **progress widget** dedupes by planned course (one course = one tick toward overall progress, no matter how many requirements it satisfies).

**Listing** (= "listed satisfaction"):
A **satisfaction** where the planned course's ID appears explicitly in the rule's `ReqValue.value[]`. Rendered as a regular checkbox row in the rail.

**Pattern match** (= "pattern satisfaction"):
A **satisfaction** where the planned course is *not* a **listed course** but matches a pattern leaf (e.g. "any 3000+ CSCI"). Rendered as an italicized "applied via pattern" row inside the requirement, distinct from listed rows so the student can tell *why* the requirement is satisfied. Only possible inside `structured`-mode requirements.

**Elective**:
A planned course with zero **satisfactions** — sits in the **schedule** but contributes to no **requirement**. The rail stays silent about electives; the course's own schedule card may carry a small visual badge so the student can tell it isn't load-bearing.

### Progress

**Slot**:
The unit of per-requirement progress. A `completeCourses` rule has `n` slots (one per enumerated course). A `minimumCourses: n` rule has `n` slots (the *required* count, not the candidate-set size). A `minimumCredits` rule has **1 binary slot** (contributes 1 once the credit floor is met, 0 otherwise — see ADR-0002).

**Per-requirement progress** (= `x/y` on a rail row):
For a requirement, the sum over its rules of `(slots filled / slots total)`. Both numerator and denominator are computed by walking the rule(s) against the **planned courses**. Multi-satisfaction (one course listed in multiple requirements) checks the row in *each* affected requirement.

**Global progress** (= the `13/25 requirements met` top-right widget):
The aggregate over all requirements of per-requirement slot counts, **deduped by planned course** — a single course satisfying N requirements moves the widget by 1, not N. Per-requirement rail rows are *not* deduped (a multi-listed course still checks every box it appears in), so global progress will typically be slightly lower than a naive `sum of x / sum of y`. The widget is a vibe-meter, not a contract; the mockup's `13/25` is illustrative and would resolve to a lower number once dedupe applies.

**Credit floor**:
The `minimumCredits` total for a rule. Distinct from the rule's slot count (which is always 1 for credit rules). The credit rule's rail row may show its own granular `5 cr / 8 cr` indicator in `structured` mode, but the global widget treats it binarily.

### Workspace surfaces

**Rail** (= **program-requirements rail**):
The left-hand column of the desktop plan view. Lists every **requirement** for the plan's target **program(s)**. Primary drag-source for adding **listed courses** to the **schedule**.

**Top bar**:
The persistent header inside `/plan/[planId]` — `planu.mn` logo, centered global search input, Share button, avatar dropdown. Plan-view-specific. The landing / info / auth pages have a different header.

**Plan header**:
The inline block beneath the **top bar** showing the plan title (inline-editable), the program tag with a `change ▾` program switcher, the saved-status timestamp, and the **global progress** widget on the right. Today's `PlanHeader` atom, post-rewrite.

**Mobile rail section**:
The collapsible top-section on mobile (`< 768px`) that holds **requirements**, replacing the desktop **rail**. Defaults collapsed; tap a requirement to open its content; tap a **listed course** inside to invoke the **mobile add picker**.

**Mobile add picker**:
The "Add to which semester?" menu shown on mobile after tapping a **listed course** in the **mobile rail section** or a result in the **search dropdown**. Replaces desktop's drag-into-semester gesture. Drag is *not* a supported add gesture on mobile — interaction model diverges intentionally.

**Schedule**:
The right-hand grid of **semesters** in the desktop plan view. The drop-target for drags from both the **rail** and the **search dropdown**.

**Search dropdown**:
The inline result list that opens beneath the top-bar search input once the user types a query. Renders `CourseStub` results compactly. Whole-row drag-source (no visible handle); click without drag opens the **preview panel**. Distinct from the **rail** (program-driven, persistent) and from the **preview panel** (course-detail surface, opens on click).

**Preview panel**:
The floating draggable course-detail surface (managed by `PreviewContext`) that opens when a result row or schedule card is clicked. Persists across drags and survives navigation within the plan view.

**Stripe**:
The 4px colored left edge of a schedule card. Encodes `ColorKey` (department / level / none) — same setting as today, user-toggleable via the settings panel. Does *not* encode lock state or any status; status surfaces in the **preview panel** only.

**Lock state** (= `PlannedCourse.lock`):
A property of a planned course (`locked` / `unlocked` / `autofilled`). Has *zero* on-card affordance — the schedule card is silent at rest and on hover. Lock state and the lock-toggle action live in the **preview panel**. Autofill itself is parked as a future direction; the type slot stays.

**Stub vs full**:
**Search dropdown** rows are `CourseStub`s (id, dept_abbr, course_num, title — cheap, FTS-derived). Dragging a stub into the **schedule** triggers a `/api/course/full` fetch to hydrate it into a `CourseDetails`-backed **planned course**. Don't conflate the two in conversation.

## Flagged ambiguities

- **"Requirement" vs "requisite"**: the code uses `requisites` (the bucket key on `ProgramDetails`) and `ReqGroup` (the entries). In product/UX conversation, always say "requirement." Treat "requisite" as a code-only term.
- **"Group"**: appears in `ReqGroup` (a requirement) and `ProgramGroup` (a UI grouping of programs in selectors) — totally unrelated. Don't say "group" alone; say "requirement" or "program group."
- **"Schedule" vs "plan"**: a **plan** is the whole user-owned object (semesters, programs, metadata). The **schedule** is the right-hand grid *surface* that displays a plan's semesters. Don't use "schedule" as a synonym for "plan."

## Example dialogue

> **Designer:** "When the user drags MATH 3592H from the Mathematics Core row into Fall 2024, does it disappear from the rail?"
> **Engineer:** "No. The rail entry stays — it just checks the checkbox. The rail is 'what you need,' not 'what you haven't added yet.' The progress count goes from 4/4 to… well, that one's already 4/4 in the mockup, but you get the idea."
> **Designer:** "What if MATH 3592H isn't a listed course — say it's covered by 'any upper-division MATH' instead?"
> **Engineer:** "Then it's not in any rail row. It still sits in the schedule, and it still counts toward the requirement's progress (because the rule's leaf set is a pattern that matches it), but there's no checkbox row to tick. The requirement renders in `structured` mode in that case anyway, because pattern leaves disqualify it from `clean`."
