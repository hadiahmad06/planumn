# ROADMAP.md

## Documentation

- [x] Reorganized documentation structure
  - Moved non-README.md files to `docs/` folder
  - Created `docs/PROGRAM_REQUIREMENTS.md` with comprehensive overview
    - PlanAuditContext.ts and PlanAuditProvider.tsx architecture
    - Program requirement parsing and data flow
    - Drag-and-drop course name parsing into draggable classes
    - Type definitions and helper functions
    - API endpoints and integration points

## Features

- [x] Phase 1: Requirement Completion Checking (COMPLETED)
  - [x] Created `frontend/src/types/requirement.ts` with CompletionStatus type and completion checking logic
  - [x] Updated `PlanAuditContext.ts` with `requirementCompletion` state
  - [x] Updated `PlanAuditProvider.tsx` to calculate completion on plan/reqGroups changes

- [x] Phase 2: Visual Completion Indicators (COMPLETED)
  - [x] Added completion badges to requirement headers (green checkmark, yellow percentage, gray "not started")
  - [x] Updated `CourseCard.tsx` with `isCompleted` prop and green styling for completed courses
  - [x] Updated `SearchLayout.tsx` to show completion badges and highlight completed course cards
  - [x] Added `.completed` class to `CourseCard.module.css`

- [x] Phase 3: Subrequirements Status Visibility (COMPLETED)
  - [x] Added collapsed state tracking in SearchLayout
  - [x] Shows sub-requirement count badge when parent is collapsed (e.g., "2/3 sub-requirements")
  - [x] Tracks accordion collapse/expand events to update state

- [x] Phase 4: Drag-and-Drop Enhancement (COMPLETED)
  - [x] Updated `PlanDisplay.tsx` to handle dragging courses from requirements panel
  - [x] Courses can now be dragged from requirement rows directly into semester slots
  - [x] Parses course codes and looks up course details from cachedCourses

- [x] Phase 5: Enhanced Styling & UX (COMPLETED)
  - [x] Created `programRequirements.module.css` with animations and improved styling
  - [x] Added hover effects, smooth transitions, and completion animations
  - [x] Improved visual hierarchy with better spacing and typography
  - [x] Added responsive design considerations for mobile
  - [x] Applied new styles to SearchLayout components

- [x] Phase 6: Advanced Features (COMPLETED)
   - [x] Requirement filtering and search
   - [x] Course alternatives/options highlighting
   - [x] Overall progress dashboard

  **Type Definitions to Add:**
  ```typescript
  // frontend/src/types/requirement.ts (new file)
  export type CompletionStatus = {
    completed: boolean;
    completionPercentage: number;
    completedCourses: string[];
    missingCourses: string[];
    requiredCourses: number;
    requiredCredits: number;
    earnedCourses: number;
    earnedCredits: number;
  };

  export type RequirementWithCompletion = ReqGroup & {
    completionStatus?: CompletionStatus;
    subRequirements?: RequirementWithCompletion[];
  };
  ```

  **Priority Order:**
  1. Phase 1: Requirement Completion Checking (foundational)
  2. Phase 2: Visual Completion Indicators (immediate value)
  3. Phase 4: Drag-and-Drop Enhancement (core UX improvement)
  4. Phase 3: Subrequirements Status Visibility (enhanced UX)
  5. Phase 5: Enhanced Styling & UX (polish)
  6. Phase 6: Advanced Features (nice-to-have)

  **Testing Strategy:**
  - Unit tests for completion checking logic
  - Integration tests for drag-and-drop
  - Visual regression tests for styling changes
  - Test with multiple program selections
  - Test edge cases (empty plan, duplicate courses, partial completion)

## Bug Fixes

- [x] Fix localStorage SSR error in PlanProvider.tsx
  - **Issue:** `localStorage.getItem is not a function` when page is first accessed
  - **Root cause:** `localStorage` is accessed during server-side rendering
  - **Fix:** Add `mounted` state guard or `typeof window !== 'undefined'` check before accessing localStorage
  - **Files to update:**
    - `frontend/src/contexts/data/PlanProvider.tsx` - Add client-side guard for localStorage calls in useEffect hooks
    - `frontend/src/contexts/visual/DisplaySettingsProvider.tsx` - Already partially fixed, verify complete

- [x] Fix window object SSR errors causing 500 errors
  - **Issue:** `GET / 500` errors when accessing localhost due to `window` being undefined during SSR
  - **Root cause:** Direct `window.innerWidth` and `window.innerHeight` access in render and helper functions
  - **Fix:** Created SSR-safe custom hook and added proper guards
  - **Files created/updated:**
    - `frontend/src/hooks/useWindowDimensions.ts` - New custom hook for SSR-safe window dimensions
    - `frontend/src/components/organisms/CoursePreviewPanel.tsx` - Use custom hook and add mounted state
    - `frontend/src/components/organisms/CoursePreview.tsx` - Add `typeof window === 'undefined'` guard in helper function
    - `frontend/src/components/molecules/DisplaySettings.tsx` - Add `typeof window === 'undefined'` check in useEffect
  - **Verification:** Tested with `curl http://localhost:3001/` - returns 200 OK with full HTML content
