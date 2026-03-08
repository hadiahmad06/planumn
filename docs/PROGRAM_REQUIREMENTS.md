# Program Requirements

## Overview

The program requirements system handles fetching, parsing, and validating degree/major/minor requirements for UMN students. It connects to the program API, extracts required courses, and enables drag-and-drop functionality for course planning.

## Core Components

### PlanAuditContext.ts

Location: `frontend/src/contexts/data/PlanAuditContext.ts`

Provides the React context for program requirements data:

**Key State:**
- `dataFetched`: Boolean indicating if program data has been loaded
- `cachedReqCourses`: Map of course IDs to `CourseDetails` for all required courses
- `programIds`: Array of program group IDs (e.g., major/minor codes)
- `programs`: Record mapping program IDs to `ProgramDetails` objects
- `reqGroups`: Record mapping requirement group names to `ReqGroup[]` arrays

**Methods:**
- `setProgramIds(programIds)`: Update selected programs
- `setPrograms(programs)`: Update program details
- `groupedPrograms()`: Returns grouped programs (currently returns empty array)
- `onUpdate()`: Triggers program list refresh

### PlanAuditProvider.tsx

Location: `frontend/src/contexts/data/PlanAuditProvider.tsx`

Provider implementation that fetches and manages program requirement data:

**Key Functions:**

1. **`updateProgramList()`** - Main function that:
   - Fetches program details from `/api/programs` endpoint
   - Parses program metadata (name, code, campus, requisites)
   - Extracts unique requirement groups using `uniqueReqGroups()`
   - Fetches course details for all required courses using `fetchCourseDetailsFromCd()`
   - Caches course data in `cachedReqCourses` for performance

2. **Data Flow:**
   ```
   User selects program → updateProgramList() → API call
   → Parse ProgramDetails → Extract reqGroups → Fetch CourseDetails
   → Cache in cachedReqCourses → Update context
   ```

## Type Definitions

### Program Types (`frontend/src/types/program.ts`)

**ProgramDetails:**
- Basic info: `id`, `name`, `code`, `campus`, `type` (Major/Minor)
- Academic info: `career`, `college`, `departmentOwnership`, `level`
- Metadata: `description`, `effectiveStartDate`, `cipCode`, etc.
- **`requisites`**: Record<string, ReqGroup[]> - Contains requirement rules

**Requirement Hierarchy:**
```
ProgramDetails
  └─ requisites: Record<string, ReqGroup[]>
     ├─ "requisitesSimple": ReqGroup[] (main requirements)
     └─ ReqGroup
        ├─ id, name, type, requirementLevel
        └─ rules: ReqRule[]
           ├─ condition: "minimumCredits" | "minimumCourses" | "completeCourses"
           ├─ minCourses, minCredits
           └─ value: ReqCondition
              └─ values: ReqValue[]
                 └─ value: string[] (course codes like "CS 1111", "MATH 1271")
```

### Course Types (`frontend/src/types/plan.ts`)

**Key Types:**
- `Course`: Base type with `id: number`
- `CourseStub`: Search results with `dept_abbr` and `course_num`
- `CourseDetails`: Full course info (extends CourseStub with campus, credits, grades, etc.)
- `QueriedCourse`: Search result with full details (alias for CourseDetails)
- `PlannedCourse`: Course with lock metadata
- `CourseMetadata`: Course planned in a semester (Course + lock status)

## Helper Functions

### Program Handlers (`frontend/src/types/programHandlers.ts`)

1. **`uniqueReqGroups(programs: ProgramDetails[]): ReqGroup[]`**
   - Removes duplicate requirement groups across multiple programs
   - Uses `program.requisites["requisitesSimple"]` to access requirements
   - Returns deduplicated array of requirement groups

2. **`getCourseIdsFromPrograms(programs: ProgramDetails[]): string[]`**
   - Recursively extracts all course codes from program requirements
   - Traverses `ReqRule` hierarchy (including nested `subRules`)
   - Extracts course codes from `ReqValue.value[]`
   - Returns array of course codes (e.g., `["CS 1111", "MATH 1271"]`)

### Plan Handlers (`frontend/src/types/planHandlers.ts`)

1. **`fetchCourseDetailsFromCd(ids: string[]): Promise<Record<string, CourseDetails>>`**
   - Fetches course details from `/api/course/full` using course designator (cd)
   - Uses course codes (e.g., "CS 1111") as identifiers
   - Returns map keyed by `courseGroupId` (CourserDog ID)

2. **`fetchCourseDetailsFromId(ids: string[]): Promise<Record<number, CourseDetails>>`**
   - Fetches course details using numeric course IDs
   - Returns map keyed by `id` (numeric ID)

3. **`normalizeSemesters(semesters: Semester[]): Semester[]`**
   - Sorts and fills in missing semester slots
   - Ensures Fall (3), Spring (5), Summer (9) pattern is maintained

## Drag-and-Drop System

### Course Parsing into Draggable Classes

**Step 1: Course Search Results**
When users search for courses, results are fetched as `CourseStub` objects:
```typescript
// frontend/src/components/molecules/SearchBar.tsx:164
draggableId={JSON.stringify(course)}  // course is QueriedCourse (CourseDetails)
```

**Step 2: Draggable Component**
Search results are wrapped in `Draggable` components from `@hello-pangea/dnd`:
```typescript
<Draggable
  key={`search-${course.dept_abbr}-${course.course_num}`}
  draggableId={JSON.stringify(course)}  // Serialized course object
  index={index}
>
```

**Step 3: Drop Handler**
When dropped onto a semester, the course data is parsed:
```typescript
// frontend/src/components/organisms/plan-display/PlanDisplay.tsx:89
const courseData = JSON.parse(event.data.result.draggableId) as QueriedCourse;
```

**Step 4: Adding to Plan**
The parsed course is added as `CourseMetadata`:
```typescript
courses.splice(destination.index, 0, {
  ...courseData,
  lock: "unlocked"  // Default lock state
});
```

### CourseCard Component

Location: `frontend/src/components/molecules/CourseCard.tsx`

**Responsibilities:**
- Renders course cards in both search results and semester slots
- Integrates with drag-and-drop via `Draggable` wrapper
- Accesses course data from multiple contexts:
  - `PlanContext.cachedCourses`: For planned courses
  - `PlanContext.cachedSearchResults`: For search results
  - `PlanAuditContext.cachedReqCourses`: For required courses
- Supports color coding by department or level
- Shows preview on hover/click

**Key Props:**
- `courseId`: Number or string ID
- `isDraggable`: Enable/disable drag functionality
- `source`: "search" | "plan" | null - determines data source
- `semName`: Semester name for plan courses
- `fixedWidth`, `fixedHeight`: Size controls

## Data Flow Diagram

```
User Action
    ↓
[PlanAuditProvider.updateProgramList()]
    ↓
Fetch ProgramDetails from /api/programs
    ↓
Parse requisites → ReqGroup[] → ReqRule[]
    ↓
Extract course codes → ["CS 1111", "MATH 1271"]
    ↓
[fetchCourseDetailsFromCd()]
    ↓
Fetch CourseDetails → cachedReqCourses[courseGroupId]
    ↓
[SearchBar] searches courses
    ↓
Results as QueriedCourse[]
    ↓
<Draggable draggableId={JSON.stringify(course)}>
    ↓
User drags and drops
    ↓
[PlanDisplay.onDrop] → JSON.parse(draggableId)
    ↓
Add to plan as CourseMetadata
    ↓
[CourseCard] renders from cachedCourses
```

## API Endpoints

### `/api/programs`
- **Method:** POST
- **Body:** `{ programGroupIds: string[] }`
- **Response:** Array of program details with requisites

### `/api/course/full`
- **Method:** POST
- **Body:** `{ from: "cd" | "id", ids: string[] }`
- **Response:** Array of `CourseDetails` objects
- **Usage:**
  - `from: "cd"`: Fetch by course designator (e.g., "CS 1111")
  - `from: "id"`: Fetch by numeric course ID

## Key Integration Points

1. **PlanContext** - Provides `plan` (user's course plan) and `cachedCourses`
2. **PlanAuditContext** - Provides `cachedReqCourses` (required courses from programs)
3. **DisplaySettingsContext** - Controls color coding options
4. **PreviewContext** - Manages course preview panels
5. **MobileContext** - Responsive layout handling

## Usage Example

```typescript
// In a component
import { useContext } from "react";
import { PlanAuditContext } from "@/contexts/data/PlanAuditContext";

function MyComponent() {
  const { programIds, setProgramIds, cachedReqCourses } = useContext(PlanAuditContext);

  // Select a program
  const handleSelectProgram = (programId: string) => {
    setProgramIds([...programIds, programId]);
  };

  // Access required courses
  const requiredCourses = Object.values(cachedReqCourses);

  return (
    // ...
  );
}
```

## Notes

- Course IDs can be either numeric (database ID) or string (course designator)
- The "cd" (course designator) is the UMN course code format: "DEPT 1234"
- Multiple programs can be selected; requirements are merged and deduplicated
- Draggable IDs use `JSON.stringify()` to serialize full course objects
- Course metadata includes lock states: "locked", "unlocked", "autofilled"