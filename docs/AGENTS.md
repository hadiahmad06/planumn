# AGENTS.md

Guidelines for agentic coding agents working in this repository.

## Project Overview

PlanUMN is a Next.js 15 graduation planner for University of Minnesota students. Built with React 19, TypeScript, Mantine UI, Tailwind CSS v4, and Supabase.

## Commands

All commands should be run from the `frontend/` directory:

```bash
# Development
npm run dev              # Start dev server with Turbopack (localhost:3000)

# Build
npm run build            # Production build
npm run start            # Start production server

# Linting
npm run lint             # Run ESLint

# Testing (Vitest)
npm run test                         # Run all tests
npm run test:watch                   # Run tests in watch mode
npm run test:file src/path/to/test   # Run single test file
npm run test:coverage                # Run with coverage report
```

## Code Style

### Import Order

Group imports in this order, separated by blank lines:

1. React directives and hooks (`"use client"`, `useContext`, `useState`, etc.)
2. External libraries (Next.js, Mantine, date-fns, etc.)
3. Internal imports using `@/` path alias
4. Relative imports (`./`, `../`)
5. CSS modules and static assets

```tsx
"use client";

import { useContext, useEffect, useState } from "react";
import { Box, Flex, Text } from "@mantine/core";
import { useRouter } from "next/navigation";

import { PlanContext } from "@/contexts/data/PlanContext";
import { CourseDetails } from "@/types/plan";

import LocalComponent from "./LocalComponent";
import styles from "./Component.module.css";
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `CourseCard.tsx`, `PlanHeader.tsx` |
| Hooks/Functions | camelCase | `useMobile`, `fetchCourseDetails` |
| Types | PascalCase | `type Plan`, `interface CourseDetails` |
| Constants | SCREAMING_SNAKE_CASE | `CARD_FIXED_WIDTH`, `SEMESTER_GAP` |
| CSS Modules | `Component.module.css` | `CourseCard.module.css` |
| Context files | PascalCase + Context/Provider | `PlanContext.ts`, `PlanProvider.tsx` |

### TypeScript Guidelines

**Stricter Typing (Preferred for New Code):**

- Avoid `any`. Use `unknown` with type guards for truly unknown values
- Use explicit return types for exported functions
- Prefer `interface` for extendable types, `type` for unions/primitives
- Type API response data before use

```tsx
// Good
export async function fetchPlan(id: string): Promise<Plan | null> {
  const res = await fetch(`/api/plan/${id}`);
  if (!res.ok) return null;
  return res.json() as Promise<Plan>;
}

// Avoid
export async function fetchPlan(id: string): Promise<any> {
  const res = await fetch(`/api/plan/${id}`);
  return res.json();
}
```

**Catch Block Typing:**

```tsx
// Good
try {
  // ...
} catch (err: unknown) {
  if (err instanceof Error) {
    console.error(err.message);
  }
}

// Avoid
try {
  // ...
} catch (err: any) {
  console.error(err.message);
}
```

### Error Handling

**API Routes (src/app/api/):**
- Use try-catch with structured JSON responses
- Return appropriate HTTP status codes

```tsx
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // ... logic
    return NextResponse.json({ data }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Components:**
- Use Mantine Notifications for user-facing errors
- Log errors with `console.error` (remove debug `console.log` before committing)

```tsx
import { notifications } from "@mantine/notifications";

// User-facing error
notifications.show({
  title: "Error",
  message: "Failed to save plan",
  color: "red",
});
```

## Project Structure

```
frontend/src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (server-side)
│   ├── plan/              # Plan pages
│   └── layout.tsx         # Root layout with providers
├── components/
│   ├── atoms/             # Base components (Button, Input)
│   ├── molecules/         # Compound components (CourseCard, SearchBar)
│   └── organisms/         # Page sections (PlanDisplay, SearchLayout)
├── contexts/
│   ├── data/              # Data context providers (PlanContext, UserSession)
│   └── visual/            # UI state providers (MobileContext, DisplaySettings)
├── lib/                   # Utilities and helpers
├── styles/                # Theme and global styles
├── types/                 # TypeScript type definitions
└── utils/                 # Supabase client utilities
```

## Component Architecture

### Atomic Design Pattern

- **Atoms**: Single-responsibility base components (no business logic)
- **Molecules**: Combinations of atoms with limited state
- **Organisms**: Complex components with business logic, may consume contexts

### Context Pattern

```
src/contexts/data/PlanContext.ts     # Type definitions + createContext
src/contexts/data/PlanProvider.tsx   # Provider implementation
```

Consumers import from the context file:

```tsx
import { PlanContext } from "@/contexts/data/PlanContext";
// Use in component
const { plan, setPlan } = useContext(PlanContext);
```

## Styling

- **Mantine UI**: Primary component library (`@mantine/core`)
- **Tailwind CSS v4**: Utility classes in `globals.css`
- **CSS Modules**: Component-scoped styles (`*.module.css`)
- **Inline styles**: Acceptable for dynamic values, prefer CSS modules for static styles

## Testing with Vitest

### Test File Location

Place test files adjacent to the source file:

```
src/components/molecules/CourseCard.tsx
src/components/molecules/CourseCard.test.ts
```

### Writing Tests

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CourseCard from "./CourseCard";

describe("CourseCard", () => {
  it("renders course code", () => {
    render(<CourseCard courseId={12345} />);
    expect(screen.getByText(/CS /)).toBeInTheDocument();
  });
});
```

### Running Tests

```bash
npm run test                  # All tests
npm run test:watch            # Watch mode
npm run test:file src/components/molecules/CourseCard.test.ts
```

## Environment Variables

Required for full functionality (create `frontend/.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Key Dependencies

- **Next.js 15**: App Router with Turbopack
- **React 19**: UI library
- **Mantine 8**: Component library (Core, Hooks, Notifications, Carousel, Dropzone)
- **Tailwind CSS 4**: Utility-first CSS
- **Supabase**: Authentication and database
- **@hello-pangea/dnd**: Drag and drop
- **date-fns**: Date utilities

## Common Patterns

### Fetching Data

```tsx
const response = await fetch("/api/course/full", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ids: courseIds }),
});
if (!response.ok) throw new Error(`Failed: ${response.statusText}`);
const data: CourseDetails[] = await response.json();
```

### Using Contexts

```tsx
"use client";

import { useContext } from "react";
import { PlanContext } from "@/contexts/data/PlanContext";
import { useMobile } from "@/contexts/visual/MobileProvider";

export default function MyComponent() {
  const { plan, setPlan } = useContext(PlanContext);
  const { isMobile } = useMobile()`;
  // ...
}
```

## Notes

- Path alias `@/*` maps to `src/*`
- Use `"use client"` directive for client components
- Run `npm run lint` before committing
- Remove debug `console.log` statements before committing

---

# Notifications

You have access to a phone notification script. Use it to ping me whenever something important happens.

Run this command to send a notification:
```
bash ~/.config/opencode/notify-phone.sh \"your message\" \"tag\"
```

The second argument is an emoji tag — it controls the notification sound on iPhone via the Ntfy app.

## When to notify

| Situation | Example message |
|---|---|
| Task fully completed | `✅ Done: built auth flow` |
| Need permission or approval | `🔐 Need permission: delete 3 files in /src` |
| Blocked / can't proceed | `⛔ Blocked: missing env var NEXT_PUBLIC_API_URL` |
| Unrecoverable error | `❌ Error: build failed — tsc type errors in app/page.tsx` |
| Long task started | `🚀 Started: refactoring database layer` |

## Rules

- Keep messages short and specific (under 80 chars)
- Always notify before asking a clarifying question that requires my input
- Always notify when a task is fully done, not just when you think you're close
- Do NOT notify for every small step — only the events above
