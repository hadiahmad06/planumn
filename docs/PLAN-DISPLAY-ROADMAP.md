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
- Clicking any semester header expands/collapses ALL semesters in that year
- Smart click behavior based on selection and expand state:
  - If clicked semester is selected AND expanded → collapse year AND deselect
  - If clicked semester is not selected AND another semester is selected AND expanded → select clicked semester (collapse other year's semesters)
  - If clicked semester is collapsed → expand year AND select semester
- No separate year header needed (removed)

### Implementation Steps
1. Removed `collapsedYears` state (no longer needed)
2. Removed year header component and chevron icon
3. Created `handleSemesterClick()` function with logic:
   ```typescript
   if (isSelected && isExpanded) {
     // Collapse year and deselect
     toggleYearCollapse(...);
     setSelectedSemesters(...remove...);
   } else if (!isSelected && hasSelectedExpanded) {
     // Select clicked semester
     setSelectedSemesters(...add...);
   } else if (!isExpanded) {
     // Expand year and select
     setClosedAccordion(...expand...);
     setSelectedSemesters(...add...);
   }
   ```
4. Simplified year layout back to horizontal row

### Files to Modify
- `frontend/src/components/organisms/plan-display/PlanDisplay.tsx`

### Design Considerations
- Removed: Year header component (no longer needed)
- Kept: Semester selection visual feedback
- Changed: Click behavior to handle both selection and year expansion

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
- [x] Clicking semester header expands/collapses all semesters in that year
- [x] Smart click behavior handles selection and expansion correctly
- [x] Year manipulation buttons are positioned correctly (top-right and bottom-right)
- [x] All interactions feel smooth and responsive
- [ ] Works on both desktop and mobile (desktop only implemented per requirements)
- [ ] Accessibility requirements met (keyboard nav, ARIA labels) - partially implemented with tooltips
- [x] No performance degradation with large plans
- [x] Build completes successfully with no errors

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
- Updated `Accordion.Control` styles to show selected state:
  - Background: Light pink gradient when selected
  - Border: 2px solid maroon (#811331) when selected
  - Box shadow: Enhanced shadow for selected semesters
- Click behavior integrated with year expansion (see Phase 2)
- Selection persists and is visually clear

### Phase 2: Year-Level Expand/Collapse ✅
- Removed separate year header component (simplified UX - user requirement)
- Created `handleSemesterClick()` function with smart logic:
  ```typescript
  if (isSelected && isExpanded) {
    // Collapse year and deselect clicked semester
    toggleYearCollapse(year, yearSemesters);
    setSelectedSemeters(...remove...);
  } else if (!isSelected && hasSelectedExpanded) {
    // Select clicked semester (other year remains expanded)
    setSelectedSemesters(...add...);
  } else if (!isExpanded) {
    // Expand year and select clicked semester
    toggleYearCollapse(year, yearSemesters);
    setSelectedSemeters(...add...);
  }
  ```
- Clicking any semester header now controls ALL semesters in that year
- Simplified year layout back to horizontal row (no year header needed)
- Maintains smooth transitions for all state changes

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
- Added hover effects to all ActionIcon buttons (background darkens on hover)
- Smooth transitions (0.2s ease) on all interactive elements
- All state changes work seamlessly together:
  - Semester selection works with smart click behavior
  - Year expand/collapse controlled by any semester in that year
  - Button manipulations work with new layout
- Maintained all existing functionality (drag-and-drop, course previews, etc.)
- No linting errors introduced in modified files

### Files Modified
- `frontend/src/components/organisms/plan-display/PlanDisplay.tsx` (desktop only)
- `docs/PLAN-DISPLAY-ROADMAP.md` (updated status)

### Design Decisions
1. **Semester Selection**: Uses 2px maroon border + light pink background for clear visual feedback
2. **Year Expansion**: No separate year header - clicking any semester header controls all semesters in that year
3. **Smart Click Behavior**: Semester click handles both selection and year expansion based on current state
4. **Button Layout**: Both button groups on right side for consistent navigation pattern
5. **Transitions**: 0.2s for most interactions for smooth feel
6. **Tooltips**: Positioned "left" so they don't go off-screen on right side

### Known Limitations (Future Work)
- Mobile version not modified (as requested)
- No keyboard navigation support yet
- Semester selection purpose not yet defined (for future bulk operations)
- No ARIA labels for accessibility (tooltips provide some support)
- Year selection not implemented (only individual semester selection)
- FIND BETTER WAY TO CACHE AND LAZYLOAD COURSE DATA
- Click behavior complexity may need user testing for discoverability