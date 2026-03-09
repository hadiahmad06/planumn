# Plan Display Architecture

This document provides an overview of the plan display UI components and their organization.

## Overview

The plan display is organized using the **Atomic Design Pattern** with components split into:
- **Atoms**: Base, single-responsibility components
- **Molecules**: Combinations of atoms with limited state
- **Organisms**: Complex components with business logic that may consume contexts

---

## Core Components

### `components/organisms/plan-display/`

#### PlanDisplay.tsx (Main Entry)
**Type**: Organism  
**Purpose**: Main container that switches between desktop and mobile views based on screen size

**Key Features**:
- Responsive layout using `MobileContext` to render `PlanDisplayMobile` or `PlanDisplayDesktop`
- Desktop view organized as split pane (40% search, 60% plan display)
- Semester grouping by academic year (Fall/Spring/Summer)
- Accordion-based semester expand/collapse
- Drag-and-drop support via `@hello-pangea/dnd`
- Year manipulation buttons (add/remove years)
- Credit line display (1 credit = 1 line of height)
- Credit calculation from cached courses

**Layout Structure**:
```
Group (100vw × 100vh)
├─ Box (40%) - SearchLayout
└─ Box (60%) - Plan Display
   ├─ PlanHeader
   └─ ScrollArea
      └─ Flex (years)
         └─ Flex (year row: Fall, Spring, Summer)
            └─ Accordion (semester)
               ├─ Accordion.Control (semester title)
               └─ Accordion.Panel
                  └─ Droppable (semester courses)
                     └─ CourseCard[]
```

**Key Constants**:
```typescript
const SEMESTER_BOX_WIDTH = "160px";
const SEMESTER_BOX_MIN_HEIGHT = "90px";
const CREDIT_LINE_HEIGHT = "20px";
const COURSE_VERTICAL_GAP = 0;
```

**State Management**:
- `closedAccordion`: Tracks collapsed semesters for border radius styling
- `yearManipulate`: Tracks year manipulation state

**Event Handling**:
- Listens for `DRAG_END` messages to handle course drops
- Handles moves from search results and between semesters
- Handles `AUTOFILL` messages for course locking

---

#### PlanDisplayMobile.tsx
**Type**: Organism  
**Purpose**: Mobile-optimized plan display using carousel layout

**Key Features**:
- Carousel-based semester navigation (Mantine Carousel)
- Auto-scrolls to current semester based on date
- Shows one semester at a time with 80% slide size
- Visual feedback: active semester highlighted with border and scale
- Course details displayed inline with course cards
- Bubble indicators at bottom for semester position

**Slide Types**:
```typescript
type SlideItem =
  | { type: 'edge'; position: 'left' | 'right' }
  | { type: 'semester'; sem: Semester; idx: number };
```

**Auto-Positioning Logic**:
- Calculates current season based on month
- Maps to semester index format (e.g., "1259" for Fall 2025)
- Scrolls to nearest semester or first semester

**Layout Structure**:
```
Box (100dvw × 50dvh)
├─ Carousel
│  └─ Carousel.Slide (semester)
│     ├─ Title (season + year)
│     ├─ Text (credits count)
│     └─ Flex (courses)
│        └─ CourseCard + Details
└─ Flex (bubble indicators)
```

---

#### PlanDisplayMobile.module.css
**Purpose**: Styling for mobile carousel and semester cards

**Key Classes**:
- `.carouselContainer`: Full viewport width/height container
- `.semesterCard`: Semester card with transform and border transitions
- `.edgeCard`: Placeholder cards for future year manipulation (currently commented out)
- `.bubble` / `.activeBubble`: Semester position indicators

**Styling Highlights**:
- Smooth transitions for scale and border changes
- Active semester: 0.95 scale, 1px solid #811331 border
- Inactive semester: 0.85 scale, transparent border
- Pink/maroon accent colors (#811331)

---

### `components/atoms/`

#### PlanHeader.tsx
**Type**: Atom  
**Purpose**: Displays plan title, program selection, and save status

**Key Features**:
- Editable plan title with auto-growing input
- Program multi-select from `programOptions.json`
- Save status display with timestamp
- Authentication state handling
- Retry mechanism for failed saves

**Components**:
1. Title input (auto-width based on content)
2. MultiSelect for program selection
3. Save status text:
   - "Saving..." (in progress)
   - "Saved X minutes ago" (success)
   - Error message with retry link (failure)
   - "You must be logged in to Save to Cloud" (no auth)

**State Management**:
- `titleLocal`: Local state for title input
- `inputWidth`: Dynamic width calculation

**Contexts Used**:
- `PlanContext`: Plan data and save status
- `UserSessionContext`: Authentication state
- `PlanAuditContext`: Program selection

---

### `components/molecules/`

#### PlanRow.tsx
**Type**: Molecule  
**Purpose**: Displays a single plan in the plan list (not the plan view itself)

**Key Features**:
- Displays plan title, progress, course/credit counts, dates
- Interactive delete/recover buttons
- Hover effects with expanding padding
- Alternating row colors
- Progress bar showing completion percentage (0-100% based on 120 credits)
- Skeleton loading variant

**Grid Layout**:
- Desktop: 10 columns (title, spacer, progress, spacer, courses, credits, last updated, created, delete button)
- Mobile: 7 columns (condensed)

**State**:
- `buttonLoading`: Loading state for delete/recover buttons

**Props**:
```typescript
interface PlanRowProps {
  plan: PlanNullable;
  index: number;
  creditMap: Record<string, { id: number; cred_min: number; cred_max: number }>;
  onDelete?: (id: string) => void;
  isDeleted?: boolean;
  onClick?: () => void;
  onRecover?: (id: string) => void;
}
```

---

#### CourseCard.tsx
**Type**: Molecule  
**Purpose**: Displays individual course as draggable card

**Key Features**:
- Dynamic height based on credit count (20px per credit)
- Color-coded by department or level (via `colorKey` from DisplaySettingsContext)
- Shiny gradient background effect (highlight/shadow/base colors)
- Lock state visualization:
  - `unlocked`: Dotted white border
  - `autofilled`: 50% opacity
  - `locked`: No special styling
- Drag-and-drop support via `@hello-pangea/dnd`
- Hover preview via PreviewContext
- Source tracking ("search" or "plan")

**Key Constants**:
```typescript
const CARD_FIXED_WIDTH = 110;
const CARD_FIXED_HEIGHT = 40;
const CARD_HEIGHT_MULTIPLIER = 20;
const SHINE_STRENGTH = 7;
```

**Props**:
```typescript
interface CourseCardProps {
  courseId: number | string;
  index?: number;
  semName?: string;
  showPreview?: boolean;
  isDraggable?: boolean;
  className?: string;
  fontSize?: string;
  source?: "search" | "plan" | null;
  fixedWidth?: boolean;
  fixedHeight?: boolean;
}
```

**Color Logic**:
- Converts hex to HSL
- Creates gradient: shadow → base → highlight
- Adjusts saturation/lightness by `SHINE_STRENGTH`

**Contexts Used**:
- `PlanContext`: Course data cache
- `DisplaySettingsContext`: Color key selection
- `PreviewContext`: Preview on hover
- `PlanAuditContext`: Requirement course cache

---

#### CourseCard.module.css
**Purpose**: Course card styling

**Classes**:
- `.card`: Base card with border-radius, flex center, white text
- `.unlocked`: Dotted white border (2px)
- `.autofilled`: Reduced opacity (0.5)
- Hover transition: `transform 0.2s`

---

### `components/organisms/`

#### SearchLayout.tsx
**Type**: Organism  
**Purpose**: Left panel containing search bar and program requirements

**Key Features**:
- Animated typing text header
- Search bar for course search
- Scrollable program requirements display
- Accordion-based requirement grouping
- Nested requirement rendering with sub-rules
- Draggable course cards from requirements
- Drop zone for dragged courses (search area)

**Requirement Rendering**:
- `renderReqCondition()`: Recursive rendering of requirement conditions
- `renderReqRules()`: Renders requirement rules with sub-rules
- Displays course/credit requirements, descriptions, notes

**Layout Structure**:
```
Stack
├─ Droppable (search)
│  ├─ Title (AnimatedTypingText)
│  └─ SearchBar
└─ ScrollArea
   └─ Accordion (requirements)
      └─ Accordion.Item
         ├─ Accordion.Control (requirement name, type)
         └─ Accordion.Panel
            └─ renderReqRules()
```

**Drag-and-Drop**:
- Requirements panel contains droppable zones
- Course cards from requirements are draggable
- Supports course selection groups with logic operators (AND/OR)

**Contexts Used**:
- `PlanAuditContext`: Requirement groups data

---

#### CoursePreview.tsx
**Type**: Organism  
**Purpose**: Individual course preview popup

**Key Features**:
- Two variants: temporary (on hover) and persistent (pinned)
- Displays course code, title, credits, description
- Grade distribution charts (BarChart + AreaChart)
- Collapsible description
- Close button for persistent previews
- Positioning system (9 possible positions)

**Position Mapping**:
```typescript
type PreviewPosition =
  | 'top-left' | 'top' | 'top-right'
  | 'left' | 'right'
  | 'bottom-left' | 'bottom' | 'bottom-right';
```

**Components**:
- `CoursePreviewEntry`: Full preview with course details
- `CoursePreviewSkeleton`: Loading state
- `GradeChartsRow`: Grade distribution visualization
- `getXYFromCoords()`: Converts position props to coordinates
- `mapPositionToCoords()`: Maps position type to CSS props

**Style Differences**:
- Temporary: Fixed position, smaller width (47.5%), no border shadow
- Persistent: Draggable, larger width (25%), border shadow

---

#### CoursePreviewPanel.tsx
**Type**: Organism  
**Purpose**: Manages all course previews (temporary + persistent)

**Key Features**:
- Renders both temporary and persistent previews
- Persistent previews are draggable (react-draggable)
- Z-index management for overlapping previews
- SSR-safe window dimension handling
- Focus management for persistent previews

**Preview Types**:
1. **Temporary**: Fixed position, no drag, shows on hover
2. **Persistent**: Draggable, pinned on click

**State Management**:
- Uses `PreviewContext` for course data
- Tracks mounted state for SSR safety

**Draggable Bounds**:
- Left: 0, Top: 0
- Right: windowWidth × 0.75
- Bottom: windowHeight × 0.9

**Components**:
- `CoursePreviewEntry` / `CoursePreviewSkeleton` for each preview

---

## Contexts

### PlanContext
**File**: `contexts/data/PlanContext.ts`

**Provides**:
```typescript
{
  plan: PlanNullable | null;
  setPlan: (plan: PlanNullable | null) => void;
  remotePlan: PlanNullable | null;
  setRemotePlan: (plan: PlanNullable | null) => void;
  cachedCourses: Record<number, PlannedCourse>;
  setCachedCourses: (courses: Record<number, PlannedCourse>) => void;
  cachedSearchResults: Record<number, CourseStub>;
  setCachedSearchResults: (courses: Record<number, CourseStub>) => void;
  planFetched: boolean;
  changesSaved: boolean;
  retryCount: number;
  setRetryCount: (retryCount: number) => void;
  error: string;
}
```

---

### PlanProvider
**File**: `contexts/data/PlanProvider.tsx`

**Responsibilities**:
- Manage plan state and persistence
- Cache course details
- Sync with remote API
- Handle localStorage backup
- Track unsaved changes

**Key Functions**:
- `cachePlannedCourses()`: Fetches and caches course details for all planned courses
- Auto-saves to localStorage on changes
- Syncs to API when authenticated
- Handles before unload warning for unsaved changes

**Effect Hooks**:
1. Mount: Load plan from localStorage
2. Plan change: Update cache, localStorage, mark unsaved
3. Unsaved + session: Auto-save to API with retry logic

---

## Type Definitions

**File**: `types/plan.ts`

### Core Types

```typescript
type LockType = "locked" | "unlocked" | "autofilled";

type Course = {
  id: number;
}

type CourseMetadata = Course & {
  lock: LockType;
}

type CourseStub = Course & {
  dept_abbr: string;
  course_num: string;
}

type CourseDetails = CourseStub & {
  campus: string;
  class_desc: string;
  total_students: number;
  total_grades: string;
  onestop: string;
  onestop_desc: string;
  cred_min: number;
  cred_max: number;
  srt_vals: string;
  courseGroupId: string;
}

type PlannedCourse = Metadata & CourseDetails;

type Semester = {
  index: string;  // Format: "1YYSS" (1=prefix, YY=year, SS=season code)
  courses: CourseMetadata[];
}

type Plan = {
  id: string;
  user_id: string;
  can_view: string[];
  title: string;
  programs: string[];
  semesters: Semester[];
  created_at: Date;
  last_updated: Date;
  deletion_scheduled_at: Date | null;
}

type ColorKey = "none" | "department" | "level";
```

### Semester Index Format
- Prefix: `1`
- Year: Last 2 digits (e.g., `25` for 2025)
- Season: `3` (Spring), `6` (Summer), `9` (Fall)
- Example: `1259` = Fall 2025

---

## Utility Functions

### `lib/ManipulateYear`
**Purpose**: Add/remove years from plan

**Functions**:
- `AddPrecedingYear`: Add year at the beginning
- `RemovePrecedingYear`: Remove earliest year
- `AddLatestYear`: Add year at the end
- `RemoveLatestYear`: Remove latest year

---

## Data Flow

### Course Display Flow
1. Plan loads from localStorage or API
2. `PlanProvider` caches all course details via `fetchCourseDetailsFromId()`
3. `PlanDisplay` renders semesters grouped by academic year
4. Each semester renders `CourseCard` components
5. `CourseCard` looks up course data from `cachedCourses`
6. Card displays with appropriate color and lock state

### Drag-and-Drop Flow
1. User drags course from search or requirement panel
2. `DragDropContext` handles drag events
3. `PlanDisplay` listens for `DRAG_END` message
4. Determines source (search, semester, or requirement)
5. Updates plan state by moving course to destination
6. `PlanProvider` detects change, updates cache, and syncs

### Preview Flow
1. User hovers over course card
2. `CourseCard` calls `setTempPreview()` via `PreviewContext`
3. `CoursePreviewPanel` renders temporary preview
4. User clicks to pin: `addPersistPreview()` adds to persistent list
5. Persistent previews rendered with draggable wrapper
6. Click close button: `removePersistPreview()` removes from list

---

## Styling System

### Theme Integration
Uses Mantine UI components with custom styling:
- Inline styles for dynamic values
- CSS modules for component-scoped styles
- Theme values from `@/styles/theme`

### Color Scheme
- Primary: Maroon (#811331)
- Backgrounds: Gradients with rgba
- Course cards: Dynamic colors by department/level
- Semester boxes: Light gradient backgrounds

### Responsive Design
- Desktop: Full side-by-side layout
- Mobile: Carousel-based single semester view
- Breakpoint handled by `MobileContext`

---

## Known Limitations

1. **Mobile Year Manipulation**: Add/remove year buttons not implemented in mobile view
2. **Edge Cards**: Left/right edge placeholder cards in carousel are commented out
3. **Accordion State**: State tracking for closed accordions affects border radius only
4. **Credit Line Height**: Fixed at 20px per credit, may need adjustment for different screens
5. **Semester Selection**: Not currently implemented (planned feature)
6. **Year-Level Controls**: Only semester-level expand/collapse exists (year-level planned)

---

## Related Files

### Context Providers
- `contexts/data/PlanContext.ts`
- `contexts/data/PlanProvider.tsx`
- `contexts/visual/MobileContext.tsx`
- `contexts/visual/DisplaySettingsContext.tsx`
- `contexts/visual/PreviewContext.tsx`
- `contexts/data/PlanAuditContext.ts`

### Type Handlers
- `types/planHandlers.ts` - `fetchCourseDetailsFromId()`

### Utilities
- `lib/ManipulateYear.ts`
- `lib/colors.ts` - `getCourseColor()`

### Hooks
- `hooks/useWindowDimensions.ts` - SSR-safe window dimensions

---

## Dependencies

### UI Libraries
- `@mantine/core` - Core components (Box, Flex, Text, Accordion, etc.)
- `@mantine/carousel` - Carousel for mobile view
- `@mantine/hooks` - useDisclosure hook
- `@hello-pangea/dnd` - Drag and drop
- `react-draggable` - Draggable previews

### Utility Libraries
- `date-fns` - Date formatting
- `@tabler/icons-react` - Icons (IconPlus, IconMinus, etc.)

---

## Future Enhancements

See `docs/PLAN-DISPLAY-ROADMAP.md` for planned improvements:
- Semester selection capability
- Year-level expand/collapse
- Button reorientation for better UX
- Enhanced mobile year manipulation