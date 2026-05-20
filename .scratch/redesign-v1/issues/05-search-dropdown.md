# Slice 5: Top-bar search dropdown

Status: ready-for-agent

## Parent

[`../PRD.md`](../PRD.md)

## What to build

Turn the top-bar search input (placeholder from Slice 2) into a real catalog search with an inline dropdown of results. Add courses to the schedule by dragging from the dropdown — this is the secondary add-path (the rail is primary per Q2).

### Behavior

- **Empty focused state**: no dropdown opens (typing is required to open results per Q7 / empty-state choice i)
- **Typing**: results appear in an inline dropdown beneath the input, ~8 visible at a time, scroll for more
- **Result rows**: compact (course code + title + credits), rendered from `CourseStub` shape via `/api/search`
- **Drag**: whole-row drag-source; dropdown stays open during drag (hook into `onDragStart` to suppress close-on-blur)
- **Drop into a semester**: stub gets hydrated via `/api/course/full` and added as a `PlannedCourse`
- **Click without drag**: opens the **preview panel** with the course
- **Dismiss**: click outside or Esc
- **Portal rendering**: dropdown renders as a fixed-position Portal child to avoid clipping by ancestor overflow

## Acceptance criteria

- [ ] Search input opens dropdown only when user types (empty focus shows nothing)
- [ ] Result rows show course code + title + credit count
- [ ] Whole result row is a drag source (no visible handle)
- [ ] Dragging a result into a semester adds the course to the plan and saves
- [ ] Dragging triggers `/api/course/full` for the dropped course to hydrate `CourseDetails`
- [ ] Clicking a result without dragging opens the preview panel
- [ ] Dropdown stays open mid-drag; closes after drop or after Esc/click-outside
- [ ] Dropdown renders via Portal (not clipped by parent overflow)
- [ ] Standard search behavior preserved (FTS-driven results from `/api/search`)
- [ ] No regression in plan persistence

## Blocked by

- [`03-schedule.md`](./03-schedule.md)
