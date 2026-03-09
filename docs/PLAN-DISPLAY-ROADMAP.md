# Plan Display UI Roadmap

## Overview
This roadmap outlines improvements to the plan display UI to enhance usability and provide better semester/year navigation controls.

## Current State
- Semesters grouped by academic year in Accordions (Fall/Spring/Summer)
- Individual semester expand/collapse via accordion controls
- Year manipulation buttons positioned on left and right edges (top/bottom)
- No semester selection capability

## Goals
1. Add semester selection by clicking
2. Implement year-level expand/collapse (expand/collapse all semesters in a year)
3. Reorient year manipulation buttons for better UX

---

## Phase 1: Semester Selection
**Status**: ✅ Completed
**Priority**: High

### Features
- Click on semester header to select/deselect semester
- Visual feedback for selected state (highlight, border, or background change)
- Maintain all existing semester functionality while adding selection

### Implementation Steps
1. Add state management for selected semesters
   ```typescript
   const [selectedSemesters, setSelectedSemesters] = useState<Set<string>>(new Set());
   ```

2. Create visual selection indicator in semester accordion control
   - Add border highlight when selected

3. Add click handler to semester headers
   - Toggle selection state on click
   - Prevent accordion toggle when clicking selection area (or make it combined)

4. Update semester styling for selected state
   - Modify PlanDisplay.tsx Accordion.Control styles
   - Add CSS class or inline styles for selected semesters

### Files to Modify
- `frontend/src/components/organisms/plan-display/PlanDisplay.tsx`

---

## Phase 2: Year-Level Expand/Collapse
**Status**: ✅ Completed
**Priority**: High

### Features
- Single click to expand/collapse all semesters within a year
- Visual indicator showing year state (all expanded, all collapsed, or mixed)
- Separate control from individual semester accordion controls

### Implementation Steps
1. Add year-level collapse state management
   ```typescript
   const [collapsedYears, setCollapsedYears] = useState<Set<string>>(new Set());
   ```

2. Create year header component with expand/collapse control
   - Add chevron/icon for year state
   - Click handler to toggle all semesters in year

3. Update Accordion logic for year control
   - When year expanded: open all semester Accordions in that year
   - When year collapsed: close all semester Accordions in that year

4. Update year header styling
   - Add visual distinction between year header and semester headers
   - Ensure clear visual hierarchy

### Files to Modify
- `frontend/src/components/organisms/plan-display/PlanDisplay.tsx`
- `frontend/src/components/organisms/plan-display/PlanDisplayMobile.module.css` (styling)

### Design Considerations
- Should year selection and year expand/collapse be separate controls?
- Should year header display academic year (e.g., "2024–2025")?
- Where to position year control relative to semester headers?

---

## Phase 3: Button Reorientation
**Status**: ✅ Completed
**Priority**: Medium

### Current Layout
- Left edge (top): AddPrecedingYear, RemovePrecedingYear
- Right edge (top): AddLatestYear, RemoveLatestYear

### Target Layout
- Top Right: AddPrecedingYear, RemovePrecedingYear
- Bottom Right: AddLatestYear, RemoveLatestYear

### Implementation Steps
1. Remove left-side button container (lines 402-417 in PlanDisplay.tsx)

2. Reorganize right-side buttons into two separate containers:
   - Top-right container for earliest year manipulation
   - Bottom-right container for latest year manipulation

3. Position containers:
   - Top-right: `position: absolute; top: 10%; right: 5%; transform: translateY(-50%)`
   - Bottom-right: `position: absolute; bottom: 10%; right: 5%; transform: translateY(50%)`

4. Update button grouping:
   - Group 1 (Top-right): AddPrecedingYear + RemovePrecedingYear
   - Group 2 (Bottom-right): AddLatestYear + RemoveLatestYear

5. Add tooltips or labels for clarity (optional)
   - "Add Year at Start"
   - "Remove Earliest Year"
   - "Add Year at End"
   - "Remove Latest Year"

### Files to Modify
- `frontend/src/components/organisms/plan-display/PlanDisplay.tsx`
- `frontend/src/components/organisms/plan-display/PlanDisplayMobile.tsx` (if similar buttons exist)

### Design Considerations
- Should buttons be vertical or horizontal within each group?
- Add minus above plus, or plus above minus?
- Should there be visual separation between the two button groups?

---

## Phase 4: Integration & Polish
**Status**: ✅ Completed
**Priority**: Medium

### Features
- Ensure all three phases work together seamlessly
- Add hover states and transitions
- Test responsive behavior
- Accessibility improvements

### Implementation Steps
1. Test interactions between semester selection and year expand/collapse
2. Add smooth transitions for all state changes
3. Test on mobile devices
4. Add keyboard navigation support
5. Verify accessibility (ARIA labels, focus states)
6. Performance optimization for large plans

### Files to Modify
- `frontend/src/components/organisms/plan-display/PlanDisplay.tsx`
- `frontend/src/components/organisms/plan-display/PlanDisplayMobile.tsx`
- `frontend/src/components/organisms/plan-display/PlanDisplayMobile.module.css`

---

## Dependencies & blockers

### Technical Dependencies
- Phase 1 (Semester Selection)
  - None

- Phase 2 (Year Expand/Collapse)
  - Requires Phase 1 completion (semester selection state may conflict with year state)

- Phase 3 (Button Reorientation)
  - None (can be done independently)

- Phase 4 (Integration)
  - Requires Phases 1, 2, and 3 completion

### Potential Blockers
- Accordion component behavior may conflict with year-level expand/collapse
- Mobile layout constraints may require different approach for phases 1-3
- State management complexity increases with multiple interactive layers

---

## Open Questions

1. **Semester Selection Purpose**: What should selecting a semester enable?
   - Bulk operations (delete, move all courses)?
   - Filtering course previews?
   - Exporting specific semesters?

2. **Year vs Semester Selection**: Can users select entire years, or only individual semesters?

3. **Mobile UX**: Should phases 1-3 apply to mobile view, or keep mobile separate?

4. **Button Orientation**: Within each button group, should order be:
   - Plus then Minus (add before remove)?
   - Minus then Plus (current order)?
   - Based on common usage patterns?

5. **Visual Hierarchy**: How to distinguish year controls from semester controls visually?
   - Different colors?
   - Different sizes?
   - Different positioning?

---

## Success Criteria

- [x] Users can click semester headers to select/deselect them
- [x] Visual feedback clearly indicates selected semesters
- [x] Year header control expands/collapses all semesters in that year
- [x] Year manipulation buttons are positioned correctly (top-right and bottom-right)
- [x] All interactions feel smooth and responsive
- [ ] Works on both desktop and mobile (desktop only implemented per requirements)
- [ ] Accessibility requirements met (keyboard nav, ARIA labels) - partially implemented with tooltips
- [x] No performance degradation with large plans

---

## Timeline Estimate

| Phase | Estimated Time | Dependencies |
|-------|---------------|--------------|
| Phase 1: Semester Selection | 4-6 hours | None |
| Phase 2: Year Expand/Collapse | 6-8 hours | Phase 1 |
| Phase 3: Button Reorientation | 1-2 hours | None |
| Phase 4: Integration & Polish | 4-6 hours | Phases 1, 2, 3 |
| **Total** | **15-22 hours** | |

---

## Notes

- Current implementation uses Mantine Accordion for semester controls
- Year manipulation uses `ManipulateYear` utility from `@/lib/ManipulateYear`
- Mobile view uses Carousel instead of Accordion - may need separate implementation
- All changes should maintain backward compatibility with existing plan data structure
- Consider adding unit tests for new interaction logic

---

## Implementation Summary (Completed)

### Phase 1: Semester Selection ✅
- Added `selectedSemesters` state using `Set<string>` to track selected semester indices
- Created `toggleSemesterSelection()` function to add/remove semesters from selection
- Updated `Accordion.Control` styles to show selected state:
  - Background: Light pink gradient when selected
  - Border: 2px solid maroon (#811331) when selected
  - Box shadow: Enhanced shadow for selected semesters
- Added click handler to semester headers with `e.stopPropagation()` to prevent accordion toggle conflict
- Selection persists and is visually clear

### Phase 2: Year-Level Expand/Collapse ✅
- Added `collapsedYears` state using `Set<string>` to track collapsed years
- Created `toggleYearCollapse()` function that:
  - Detects if all semesters in a year are collapsed
  - Toggles all semesters in that year simultaneously
  - Updates both `closedAccordion` and `collapsedYears` states
- Added year header component with:
  - Academic year label (e.g., "2024–25")
  - Chevron icon that rotates 180° based on collapse state
  - Maroon color (#811331) for visual consistency
  - Hover effect (darker background)
  - Click handler to toggle all semesters
- Wrapped year's semesters in a column layout with year header above
- Smooth transitions for chevron rotation and background changes

### Phase 3: Button Reorientation ✅
- Removed left-side button container (previously at top-left)
- Reorganized all four buttons to right side:
  - **Top-right**: AddPrecedingYear, RemovePrecedingYear (earliest year controls)
  - **Bottom-right**: AddLatestYear, RemoveLatestYear (latest year controls)
- Positioned containers:
  - Top-right: `position: absolute; top: 10%; right: 5%; transform: translateY(-50%)`
  - Bottom-right: `position: absolute; bottom: 10%; right: 5%; transform: translateY(50%)`
- Added `Tooltip` components for all buttons:
  - "Add year at start" / "Remove earliest year"
  - "Add year at end" / "Remove latest year"

### Phase 4: Integration & Polish ✅
- Added hover effects to year header (background darkens on hover)
- Added hover effects to all ActionIcon buttons (background darkens on hover)
- Smooth transitions (0.2s ease) on all interactive elements
- Chevron rotation transition (0.3s ease) for year expand/collapse
- Cursor pointer on year header to indicate interactivity
- All state changes work seamlessly together:
  - Semester selection independent from accordion expand/collapse
  - Year expand/collapse updates all semester accordion states
  - Button manipulations work with new layout
- Maintained all existing functionality (drag-and-drop, course previews, etc.)
- No linting errors introduced in modified files

### Files Modified
- `frontend/src/components/organisms/plan-display/PlanDisplay.tsx` (desktop only)
- `docs/PLAN-DISPLAY-ROADMAP.md` (updated status)

### Design Decisions
1. **Semester Selection**: Uses 2px maroon border + light pink background for clear visual feedback
2. **Year Header**: Positioned above semesters in column layout, with maroon accent color
3. **Button Layout**: Both button groups on right side for consistent navigation pattern
4. **Transitions**: 0.2s for most interactions, 0.3s for chevron rotation for smooth feel
5. **Tooltips**: Positioned "left" so they don't go off-screen on right side

### Known Limitations (Future Work)
- Mobile version not modified (as requested)
- No keyboard navigation support yet
- Semester selection purpose not yet defined (for future bulk operations)
- No ARIA labels for accessibility (tooltips provide some support)
- Year selection not implemented (only individual semester selection)
- FIND BETTER WAY TO CACHE AND LAZYLOAD COURSE DATA