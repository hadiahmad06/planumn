# Context Menu for CourseCard.tsx - Implementation Roadmap

## Overview
Add right-click context menu functionality to `CourseCard` component that provides location-specific actions for users across three distinct areas: search results, plan display, and program requirements.

---

## Features to Add

### Core Feature: Right-Click Context Menu

**Goal:** Users can right-click on course cards in ANY area to perform location-specific actions.

**Implementation:**
1. Add `onContextMenu` event handler to the card element
2. Create a context menu component using Mantine's `Menu` component
3. Position menu at cursor location
4. Show different menu options based on `source` prop ("search", "plan", or program requirements)
5. Add "Add to Plan" action for courses not yet in the plan
6. Add "Remove from Plan" action for courses already in the plan
7. Add navigation actions (open in new tab, copy course code)

**Context Menu by Location:**

| Location | Source Value | Actions Available |
|----------|--------------|-------------------|
| Search Results | `"search"` | Add to plan, Copy course code, Open in catalog |
| Plan Display | `"plan"` | Delete, Move to Fall 🍂, Move to Spring 🌱, Move to Summer ☀️, Move to previous year ↑, Move to next year ↓, Copy course code, Open in catalog |
| Program Requirements | `"program"` (new value) | Add to plan, Copy course code, Open in catalog |

---

## Detailed Feature Specifications

### 1. Add to Plan (Search & Program Requirements)

**Description:** When right-clicking on a course card in search results or program requirements that is NOT already in the user's plan, show an "Add to Plan" option.

**Sub-options:**
- "Add to first available semester"
- "Add to Fall [CURRENT_YEAR]" 
- "Add to Spring [NEXT_YEAR]"
- "Add to Summer [NEXT_YEAR]"

**Implementation Details:**
- Find first semester in plan with available credit slots
- Default to showing next 3 semesters as options
- Need to know plan structure and semester indices
- Check if course already exists in plan (by ID)

**Compromises Required:**
- Need access to full plan data via PlanContext (already available)
- Need utility function to find available semesters (new)
- Need to validate course prerequisites (deferred to future work)

---

### 2. Delete from Plan (Plan Display Only)

**Description:** Remove the course from its current semester in the plan.

**Implementation Details:**
- Filter out course from `plan.semesters[semesterIndex].courses`
- Update plan via `setPlan()`
- Confirm with user via Mantine modal (optional enhancement)

**Compromises Required:**
- Need current semester index (available via `semName` prop)
- Need course index within semester (available via `index` prop)
- May conflict with drag-and-drop state (must re-render plan)
- No undo functionality initially

---

### 3. Move to Semester (Plan Display Only)

**Description:** Move course to a different semester within the same academic year.

**Sub-options:**
- "Move to Fall 🍂"
- "Move to Spring 🌱"
- "Move to Summer ☀️"

**Implementation Details:**
- Parse current semester index (format: "S20XX" where S = 3, 5, or 9)
- Convert to semester key (e.g., "324" = Spring 2024)
- Calculate target semester index
- Remove course from current semester
- Add course to target semester at end
- Update plan via `setPlan()`

**Compromises Required:**
- Need semester index parsing utility (new)
- Semester index format is "SYY" (season + year), need conversion logic
- Edge case: target semester may not exist in plan yet
- Edge case: target semester may be full (need credit validation, deferred)
- Will trigger re-render and may disrupt drag-and-drop animations

---

### 4. Move to Previous/Next Year (Plan Display Only)

**Description:** Move course to the same semester in the previous or next academic year.

**Sub-options:**
- "Move to previous year ↑" (same season, year - 1)
- "Move to next year ↓" (same season, year + 1)

**Implementation Details:**
- Parse current semester index
- Calculate target semester index (adjust year by ±1)
- Handle academic year boundary (Spring 2023 → Fall 2022 is +1 year academically)
- Remove from current, add to target
- Create target semester if doesn't exist

**Compromises Required:**
- Complex semester index math
- Need to handle semester creation/deletion
- Academic year vs calendar year confusion potential
- May need to ManipulateYear utility function similar to PlanDisplay.tsx

---

### 5. Copy Course Code (All Locations)

**Description:** Copy course code (e.g., "CS 101") to clipboard.

**Implementation Details:**
- Use `navigator.clipboard.writeText()`
- Show success notification via Mantine notifications

**Compromises Required:**
- Browser compatibility (Safari requires user gesture - already covered by right-click)
- Need to add notification import

---

### 6. Open in Catalog (All Locations)

**Description:** Open course in University of Minnesota course catalog in new tab.

**Implementation Details:**
- Construct URL: `https://onestop2.umn.edu/psp/ps/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES.CLASS_SEARCH.GBL?Page=CLASS_SRCH_WRK2_SSRPB_SCR_DESCR&Action=U&ACAD_YEAR=2024&STRM=1249&SUBJ=CS&CATALOG_NBR=101`
- Actually, use `course.onestop` URL from course data if available

**Compromises Required:**
- URL construction may vary by course
- Some courses may not have onestop URL
- Need to check if onestop field exists

---

## Implementation Steps

### Phase 1: Context Menu Infrastructure
1. **Add new props to CourseCard:**
   ```typescript
   interface CourseCardProps {
     // ... existing props
     onContextMenu?: (event: React.MouseEvent, course: CourseDetails | PlannedCourse | CourseStub) => void;
     showContextMenu?: boolean;
   }
   ```

2. **Create ContextMenu component** (new file: `frontend/src/components/atoms/ContextMenu.tsx`):
   - Use Mantine Menu component
   - Accept position, items, and onClose props
   - Handle click-outside to close
   - Portal for proper z-index

3. **Add state management in parent components:**
   - SearchLayout.tsx: context menu state
   - PlanDisplay.tsx: context menu state
   - Program requirements section: context menu state

**Compromises:**
- Adds complexity to parent components
- Need to handle menu positioning carefully
- May conflict with existing hover/click handlers

---

### Phase 2: Location-Specific Actions

**For SearchBar.tsx (search results):**
- Context menu items: Add to plan, Copy code, Open catalog
- Parent manages menu state
- Calls PlanContext methods to add courses

**For PlanDisplay.tsx (plan display):**
- Context menu items: Delete, Move to Fall/Spring/Summer, Move prev/next year, Copy code, Open catalog
- Needs access to semester and course indices
- Direct plan manipulation via setPlan

**For SearchLayout.tsx (program requirements):**
- Context menu items: Add to plan, Copy code, Open catalog
- Similar to search results
- May need new source value `"program"` for CourseCard

**Compromises:**
- Need to add new `source` value `"program"` to CourseCard types
- Three different parent implementations
- Code duplication risk - consider creating shared hook

---

### Phase 3: Action Implementation

1. **Delete Course:**
   ```typescript
   const handleDelete = () => {
     const updated = [...plan.semesters];
     const sem = updated.find(s => s.index === currentSemIndex);
     if (sem) {
       sem.courses = sem.courses.filter(c => c.id !== courseId);
       setPlan({ ...plan, semesters: updated });
     }
   };
   ```

2. **Move to Semester:**
   - Create utility: `frontend/src/lib/semesterUtils.ts`
   - Parse semester index to year/season
   - Calculate target index
   - Handle creation if needed

3. **Add to Plan:**
   - Find first available semester
   - Add course with lock: "unlocked"
   - Update plan

**Compromises:**
- No credit validation initially
- No prerequisite checking initially
- May create duplicate entries if user clicks multiple times

---

### Phase 4: Polish & Edge Cases

1. **Keyboard support:** Add menu trigger on Shift+F10 or Menu key
2. **Mobile support:** Long-press instead of right-click
3. **Accessibility:** ARIA labels, keyboard navigation
4. **Error handling:** Invalid semester indices, course not found
5. **Notifications:** Success/error feedback

**Compromises:**
- Mobile may need separate implementation
- Keyboard support adds complexity
- Time trade-off: may defer to later

---

## New Files to Create

1. `frontend/src/components/atoms/ContextMenu.tsx` - Reusable context menu component
2. `frontend/src/lib/semesterUtils.ts` - Semester index manipulation utilities
3. `frontend/src/hooks/useCourseContextMenu.ts` - Shared hook for context menu state (optional, to reduce duplication)

---

## Files to Modify

1. `frontend/src/components/molecules/CourseCard.tsx`:
   - Add `onContextMenu` prop
   - Add `showContextMenu` prop
   - Add context menu state
   - Implement right-click handler
   - Add ContextMenu component integration

2. `frontend/src/components/molecules/SearchBar.tsx`:
   - Add context menu state
   - Implement menu items for search results
   - Handle "Add to Plan" action

3. `frontend/src/components/organisms/plan-display/PlanDisplay.tsx`:
   - Add context menu state
   - Implement menu items for plan display
   - Handle delete/move actions
   - Pass semester/course info to CourseCard

4. `frontend/src/components/organisms/SearchLayout.tsx`:
   - Add context menu state for program requirements
   - Implement menu items for requirements
   - Update CourseCard calls with new source value

5. `frontend/src/types/plan.ts`:
   - Update CourseCardProps interface
   - Add utility types if needed

---

## Compromises Summary

### Technical Compromises
1. **No credit validation initially:** Courses can be added/ moved without checking credit limits
2. **No prerequisite checking:** Can schedule courses without verifying prerequisites are met
3. **No undo/redo:** Deletions and moves are permanent until page refresh
4. **No conflict prevention:** Can add same course multiple times
5. **Drag-and-drop disruption:** Context menu actions re-render entire plan, may interrupt animations

### UX Compromises
1. **No confirmation dialogs:** Actions execute immediately (add confirmation later)
2. **Limited keyboard support:** Initially mouse-only, add keyboard later
3. **No visual preview:** User doesn't see result before committing
4. **Menu positioning:** May be clipped near screen edges initially

### Code Quality Compromises
1. **Code duplication:** Similar menu logic in three parent components (create shared hook later)
2. **Prop drilling:** Need to pass more info to CourseCard (semName, index, etc.)
3. **State complexity:** Multiple context menus could be open simultaneously

### Timeline Compromises
1. **Mobile support:** Defer long-press implementation to separate iteration
2. **Accessibility features:** Basic implementation first, full ARIA support later
3. **Advanced features:** Batch operations, bulk editing deferred

---

## Testing Strategy

1. **Unit tests:**
   - Semester index parsing utilities
   - Context menu component rendering
   - Menu item click handlers

2. **Integration tests:**
   - Add course to plan via context menu
   - Delete course from plan
   - Move course between semesters
   - Copy course code to clipboard

3. **E2E tests (optional):**
   - Full user flow: search → right-click → add to plan
   - Plan manipulation: right-click → move → verify

4. **Manual testing:**
   - Test in all three locations
   - Edge cases: empty plan, full semesters, duplicate courses
   - Browser compatibility: Chrome, Firefox, Safari

---

## Priority Order

1. **Phase 1:** Context menu infrastructure (foundational)
2. **Phase 2:** Location-specific menu items (visible progress)
3. **Phase 3:** Core actions (delete, move to semester)
4. **Phase 4:** Advanced actions (move year, add to plan)
5. **Phase 5:** Polish and edge cases (UX refinement)

---

## Future Enhancements (Not in Scope)

- Batch operations (multi-select courses)
- Course conflict detection (prerequisites, time conflicts)
- Credit limit validation
- Undo/redo functionality
- Quick-move suggestions (AI-powered)
- Keyboard shortcuts for common actions
- Drag-and-drop + context menu integration
- Visual indicators for available actions (hover to see options)