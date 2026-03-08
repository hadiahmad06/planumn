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
