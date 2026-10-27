"use client";

import { useDndMonitor, useDraggable, useDroppable } from "@dnd-kit/core";
import { useId, useRef, useState } from "react";
import { courseCode, formatCredits, type CourseSummary } from "@/domain/course";
import { cn } from "@/components/ui/cn";
import { useSearchShortcut } from "@/features/theme/useSearchShortcut";
import { FilterIcon, SearchIcon } from "@/components/ui/icons";
import { usePreviewStore } from "@/features/preview/store";
import { CANCEL_DROP_ID, externalId, type DragData, type DropData } from "@/features/plan-editor/dnd";
import { useCourseSearch } from "./useCourseSearch";
import { SearchFilterBar } from "./SearchFilterBar";
import { hasFilters, type SearchFilters } from "@/domain/searchFilters";
import { useRequirementOptions } from "@/features/requirements/requirementOptions";
import { termLabel } from "@/domain/terms";
import { useIsMobile } from "@/hooks/useIsMobile";
import { addCourseActions } from "@/features/plan-editor/courseActions";
import { useDisplaySettings } from "@/features/plan-editor/displaySettings";
import { hoverCourse, planActions, useEditorUi, usePlanStore } from "@/features/plan-editor/store";
import { AddToSemesterButton } from "@/features/plan-editor/AddToSemesterButton";

/**
 * Mobile tap-to-add (A32): tapping a result expands an inline "Add to which semester?" picker.
 * Inline rather than a popup menu, so focus stays in the search box and the dropdown stays open.
 */
function MobileResultRow({ course, id, expanded, onToggle }: { course: CourseSummary; id: string; expanded: boolean; onToggle: () => void }) {
  const plan = usePlanStore((s) => s.plan);
  const hidden = useDisplaySettings((s) => s.hiddenSeasons);
  const [added, setAdded] = useState<string | null>(null);
  const actions = addCourseActions(course.id, plan, hidden);
  return (
    <li id={id} role="option" aria-selected={expanded} className="rounded-row">
      <button type="button" onClick={onToggle} aria-expanded={expanded} className={cn("flex w-full items-baseline gap-3 rounded-row px-3 py-2 text-left", expanded && "bg-sunken")}>
        <span className="w-24 shrink-0 font-semibold">{courseCode(course)}</span>
        <span className="min-w-0 flex-1 truncate text-text-secondary">{course.title}</span>
      </button>
      {added && <p className="px-3 pb-1 text-micro text-success">Added to {added}</p>}
      {expanded && (
        <div className="flex flex-wrap gap-1.5 px-3 pt-1 pb-2" aria-label="Add to which semester?">
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => {
                a.run();
                if (a.label.startsWith("Add to ")) setAdded(a.label.slice(7));
              }}
              className="rounded-full border border-border bg-surface px-2.5 py-1 text-micro hover:border-accent hover:text-accent"
            >
              {a.label.replace(/^Add to /, "")}
            </button>
          ))}
        </div>
      )}
    </li>
  );
}

function ResultRow({ course, active, id }: { course: CourseSummary; active: boolean; id: string }) {
  const openPreview = usePreviewStore((s) => s.openPreview);
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
      onMouseEnter={() => hoverCourse(course.id)}
      onMouseLeave={() => hoverCourse(null)}
      className={cn(
        "flex cursor-grab items-baseline gap-3 rounded-row px-3 py-2 select-none",
        active ? "bg-sunken" : "hover:bg-sunken",
        isDragging && "opacity-40",
      )}
    >
      <span className="w-24 shrink-0 font-semibold">{courseCode(course)}</span>
      <span className="min-w-0 flex-1 truncate text-text-secondary">{course.title}</span>
      <span className="shrink-0 text-micro text-text-tertiary">{formatCredits(course.credits)} cr</span>
      <span onClick={(e) => e.stopPropagation()} className="self-center">
        <AddToSemesterButton courseId={course.id} code={courseCode(course)} />
      </span>
    </li>
  );
}

/**
 * Top-bar course search (A13). Results drop down under the input; drag a row into a semester,
 * or click it to open its preview. The dropdown stays open while a result is being dragged.
 * The filter button opens B8's smart filters (including "satisfies requirement X"); with a filter set,
 * the query may be empty.
 */
export function SearchBox() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [requirementKey, setRequirementKey] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  useSearchShortcut(inputRef);
  const listId = useId();
  const requirements = useRequirementOptions(usePlanStore((s) => s.plan));
  // A requirement whose program was removed from the plan simply stops filtering.
  const requirement = requirements.find((r) => r.key === requirementKey) ?? null;
  const effective: SearchFilters = requirement ? { ...filters, courseIds: requirement.courseIds } : filters;
  const filtered = hasFilters(effective);
  const { results, settled, error } = useCourseSearch(query, effective);
  const openPreview = usePreviewStore((s) => s.openPreview);
  const selectedTerm = useEditorUi((s) => s.selectedTerm);
  const mobile = useIsMobile();

  useDndMonitor({
    onDragStart: (e) => setDragging((e.active.data.current as DragData | undefined)?.type === "external"),
    onDragEnd: () => setDragging(false),
    onDragCancel: () => setDragging(false),
  });

  const searching = query.trim().length > 0 || filtered;
  const open = (focused || dragging) && (searching || showFilters);
  const cancelData: DropData = { type: "cancel" };
  const { setNodeRef: setCancelRef } = useDroppable({ id: CANCEL_DROP_ID, data: cancelData, disabled: !open });
  const activeIndex = Math.min(active, Math.max(results.length - 1, 0));

  return (
    <div
      ref={rootRef}
      className="relative w-full max-w-xl"
      // Focus moving between the input, the filter button and the filters keeps the dropdown open.
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 focus-within:border-accent">
        <SearchIcon className="shrink-0 text-text-tertiary" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => Math.max(0, Math.min(i + 1, results.length - 1)));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && results[activeIndex]) {
              // With a semester selected (click its header), Enter adds the course there.
              const plan = usePlanStore.getState().plan;
              if (selectedTerm && plan?.semesters.some((s) => s.index === selectedTerm))
                planActions.addCourse(selectedTerm, results[activeIndex].id);
              else openPreview(results[activeIndex].id);
            } else if (e.key === "Escape") {
              setQuery("");
              inputRef.current?.blur();
            }
          }}
          placeholder={mobile ? "Search courses" : "Search courses: csci 2041, discrete math…"}
          aria-label="Search courses"
          aria-keyshortcuts="Meta+K Control+K"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && results[activeIndex] ? `${listId}-${activeIndex}` : undefined}
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-text-tertiary"
        />
        <button
          type="button"
          onClick={() => {
            setShowFilters((v) => !v);
            inputRef.current?.focus();
          }}
          aria-label={filtered ? "Search filters (active)" : "Search filters"}
          aria-pressed={showFilters}
          className={cn(
            "relative shrink-0 rounded-full p-0.5 hover:text-accent",
            showFilters || filtered ? "text-accent" : "text-text-tertiary",
          )}
        >
          <FilterIcon />
          {filtered && <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-accent" aria-hidden />}
        </button>
        <kbd className="hidden shrink-0 text-micro text-text-secondary sm:inline" aria-hidden="true">⌘/Ctrl K</kbd>
      </div>
      {open && (
        <div
          // Keep focus in the input while pressing on a result, so the dropdown doesn't close mid-drag.
          ref={setCancelRef}
          // The filter selects need their own mouse presses to open.
          onMouseDown={(e) => {
            if (!(e.target as Element).closest("[data-search-filters]")) e.preventDefault();
          }}
          className={cn(
            "z-40 max-h-[60vh] overflow-auto rounded-card border border-border bg-surface p-1 shadow-overlay",
            mobile ? "fixed inset-x-3 top-14" : "absolute top-full right-0 left-0 mt-1",
          )}
        >
          {(showFilters || filtered) && <SearchFilterBar
              filters={filters}
              onChange={setFilters}
              requirements={requirements}
              requirement={requirement?.key ?? null}
              onRequirement={setRequirementKey}
            />}
          {!searching ? (
            <p className="px-3 py-2 text-text-tertiary">Pick a filter or type to search</p>
          ) : results.length > 0 ? (
            <ul id={listId} role="listbox" aria-label="Search results">
              {results.map((c, i) =>
                mobile ? (
                  <MobileResultRow
                    key={c.id}
                    course={c}
                    id={`${listId}-${i}`}
                    expanded={expanded === c.id}
                    onToggle={() => setExpanded(expanded === c.id ? null : c.id)}
                  />
                ) : (
                  <ResultRow key={c.id} course={c} active={i === activeIndex} id={`${listId}-${i}`} />
                ),
              )}
            </ul>
          ) : (
            <p className="px-3 py-2 text-text-tertiary">
              {!settled ? "Searching…" : error ? error : filtered ? "No courses match these filters" : "No courses found"}
            </p>
          )}
          {results.length > 0 && (
            <p className="px-3 pt-1 pb-1.5 text-micro text-text-tertiary">
              {mobile
                ? "Tap a course, then a semester to add it"
                : selectedTerm
                  ? `Enter or + adds to ${termLabel(selectedTerm)} · drag into any semester`
                  : "Drag a course into a semester, or + to add it · click for details"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
