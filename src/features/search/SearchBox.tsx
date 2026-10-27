"use client";

import { useDndMonitor, useDraggable } from "@dnd-kit/core";
import { useId, useRef, useState } from "react";
import { courseCode, formatCredits, type CourseSummary } from "@/domain/course";
import { cn } from "@/components/ui/cn";
import { SearchIcon } from "@/components/ui/icons";
import { usePreviewStore } from "@/features/preview/store";
import { externalId, type DragData } from "@/features/plan-editor/dnd";
import { useCourseSearch } from "./useCourseSearch";

function ResultRow({ course, active, id }: { course: CourseSummary; active: boolean; id: string }) {
  const openPreview = usePreviewStore((s) => s.openPreview);
  const hoverPreview = usePreviewStore((s) => s.hoverPreview);
  const data: DragData = { type: "external", source: "search", courseId: course.id };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: externalId("search", course.id), data });

  return (
    <li
      id={id}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      role="option"
      aria-selected={active}
      tabIndex={-1}
      onClick={() => openPreview(course.id)}
      onMouseEnter={() => hoverPreview(course.id)}
      onMouseLeave={() => hoverPreview(null)}
      className={cn(
        "flex cursor-grab items-baseline gap-3 rounded-row px-3 py-2 select-none",
        active ? "bg-sunken" : "hover:bg-sunken",
        isDragging && "opacity-40",
      )}
    >
      <span className="w-24 shrink-0 font-semibold">{courseCode(course)}</span>
      <span className="min-w-0 flex-1 truncate text-text-secondary">{course.title}</span>
      <span className="shrink-0 text-micro text-text-tertiary">{formatCredits(course.credits)} cr</span>
    </li>
  );
}

/**
 * Top-bar course search (A13). Results drop down under the input; drag a row into a semester,
 * or click it to open its preview. The dropdown stays open while a result is being dragged.
 */
export function SearchBox() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const { results, loading, query: settled } = useCourseSearch(query);
  const openPreview = usePreviewStore((s) => s.openPreview);

  useDndMonitor({
    onDragStart: (e) => setDragging((e.active.data.current as DragData | undefined)?.type === "external"),
    onDragEnd: () => setDragging(false),
    onDragCancel: () => setDragging(false),
  });

  const open = (focused || dragging) && query.trim().length > 0;
  const activeIndex = Math.min(active, Math.max(results.length - 1, 0));

  return (
    <div className="relative w-full max-w-xl">
      <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 focus-within:border-accent">
        <SearchIcon className="shrink-0 text-text-tertiary" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => Math.min(i + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && results[activeIndex]) {
              openPreview(results[activeIndex].id);
            } else if (e.key === "Escape") {
              setQuery("");
              inputRef.current?.blur();
            }
          }}
          placeholder="Search courses: csci 2041, discrete math…"
          aria-label="Search courses"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && results[activeIndex] ? `${listId}-${activeIndex}` : undefined}
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-text-tertiary"
        />
      </div>
      {open && (
        <div
          // Keep focus in the input while pressing on a result, so the dropdown doesn't close mid-drag.
          onMouseDown={(e) => e.preventDefault()}
          className="absolute top-full right-0 left-0 z-40 mt-1 max-h-[60vh] overflow-auto rounded-card border border-border bg-surface p-1 shadow-overlay"
        >
          {results.length > 0 ? (
            <ul id={listId} role="listbox" aria-label="Search results">
              {results.map((c, i) => (
                <ResultRow key={c.id} course={c} active={i === activeIndex} id={`${listId}-${i}`} />
              ))}
            </ul>
          ) : (
            <p className="px-3 py-2 text-text-tertiary">{loading || settled !== query.trim() ? "Searching…" : "No courses found"}</p>
          )}
          {results.length > 0 && <p className="px-3 pt-1 pb-1.5 text-micro text-text-tertiary">Drag a course into a semester · click for details</p>}
        </div>
      )}
    </div>
  );
}
