# Slice 4: Rail + requirement evaluator + global progress calculator (with tests)

Status: ready-for-agent

## Parent

[`../PRD.md`](../PRD.md)

## What to build

The real requirements rail, powered by two new deep modules shipped with Vitest tests. After this slice, students can drag listed courses from the rail into the schedule, see rail rows check, and watch the global progress widget update — all the brain logic from ADR-0001 and ADR-0002 is now live.

### Deep module 1: requirement evaluator

Pure function: `(programRequisites, plannedCourses) → RequirementProgress[]`. Each `RequirementProgress` carries:
- The requirement name
- The rules tree (preserved from `ReqGroup.rules`)
- The render mode (`clean` | `structured`) per ADR-0001
- Per-rule satisfaction state (which courses count toward each rule, capped by the rule's slot count)
- Per-leaf-course satisfaction state with the kind of satisfaction (`listing` vs `pattern`) per Q4 / 3a

A requirement renders in `clean` mode iff every rule in it is a `completeCourses` rule whose leaves are all enumerated course IDs. Anything else renders in `structured` mode.

### Deep module 2: global progress calculator

Pure function: `(plannedCourses, RequirementProgress[]) → { met: number, total: number }`. Implements course-deduped slot sum per ADR-0002:
- `completeCourses(n)` rule contributes `n` slots
- `minimumCourses(n)` rule contributes `n` slots
- `minimumCredits` rule contributes 1 binary slot (1 if credit floor met, 0 otherwise)
- A planned course satisfying N requirements moves the widget by 1, not N (course-level dedupe)

### Rail UI

Left column of `/plan/[planId]`, independently scrollable. Renders each `RequirementProgress` as an accordion item with:
- Progress ring/circle (left)
- Requirement name
- `x/y` count (right)

**Clean mode**: expanded item shows a flat list of checkbox rows, one per listed course; each row is a drag source.

**Structured mode**: expanded item shows sub-rules with their own headers, `x/y` counts, logical operators ("any 4 of"), notes, and a mix of listed-course rows (draggable) and pattern-match rows (italicized, non-draggable per Q4 / 3a).

### Global progress widget

Render the calculator's output in the plan header's top-right slot (placeholder from Slice 2 gets replaced with real values).

### Tests

Set up Vitest from scratch. Fixtures live in `__fixtures__/` next to each module. Test cases per the PRD's Testing Decisions section.

## Acceptance criteria

- [ ] Vitest configured; `npm test` runs and passes
- [ ] `__fixtures__/` directory contains realistic `ProgramDetails`-shaped fixtures: one all-`completeCourses`, one `minimumCourses` with extra candidates, one `minimumCredits`, one with sub-rules, one with pattern leaves
- [ ] Requirement evaluator tests pass: clean-vs-structured mode boundary, `completeCourses(5)` reports 5 slots, `minimumCourses(4)` caps at 4 slots not 12, `minimumCredits(8)` reports 1 binary slot, pattern leaf surfaces as pattern satisfaction, multi-listed course appears in both records
- [ ] Global progress calculator tests pass: mockup-style 13/25 input → returns `{met: 13, total: 25}` without dedupe; same input with one multi-satisfied course → returns `{met: 12, total: 25}` showing dedupe; credit rule with 6/8 met → contributes 0/1; credit rule with 9/8 met → contributes 1/1; elective doesn't change met or total
- [ ] Rail renders all `RequirementProgress` records from the user's program(s)
- [ ] `clean`-mode requirements show flat checkbox list of listed courses
- [ ] `structured`-mode requirements show sub-rules with x/y counts and operator labels
- [ ] Pattern-match rows render italicized inside structured-mode requirements and are NOT drag-sources
- [ ] Drag a listed course from rail into a semester → course is added to plan, rail row checks, global progress widget updates
- [ ] Multi-listed course (e.g. CSCI 2021 in two requirements) checks both rail rows but only bumps global progress by 1
- [ ] Rail scrolls independently from the schedule

## Blocked by

- [`03-schedule.md`](./03-schedule.md)
