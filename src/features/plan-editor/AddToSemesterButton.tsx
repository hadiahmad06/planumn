"use client";

import { useEffect, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { CourseId } from "@/domain/course";
import { termLabel } from "@/domain/terms";
import { cn } from "@/components/ui/cn";
import { CheckIcon, PlusIcon } from "@/components/ui/icons";
import { ActionMenu } from "@/components/ui/Menu";
import { addCourseActions } from "./courseActions";
import { useDisplaySettings } from "./displaySettings";
import { planActions, useEditorUi, usePlanStore } from "./store";

/**
 * "+" on any course outside the schedule (Hadi, 2026-10-27: select a semester, then click "+"). With a
 * semester selected it adds the course there in one click; with none it opens a "which semester?"
 * menu, so the button is never a dead end. A keyboard- and screen-reader-friendly alternative to drag.
 */
export function AddToSemesterButton({ courseId, code, className }: { courseId: CourseId; code: string | null; className?: string }) {
  const plan = usePlanStore((s) => s.plan);
  const selectedTerm = useEditorUi((s) => s.selectedTerm);
  const hidden = useDisplaySettings((s) => s.hiddenSeasons);
  const [added, setAdded] = useState<string | null>(null);
  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(null), 1500);
    return () => clearTimeout(t);
  }, [added]);

  const name = code ?? "this course";
  const target = selectedTerm && plan?.semesters.some((s) => s.index === selectedTerm) ? selectedTerm : null;
  const already = target ? plan!.semesters.find((s) => s.index === target)!.courses.some((c) => c.id === courseId) : false;
  const base = cn(
    "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-accent",
    className,
  );
  // dnd-kit starts drags on pointer down; keep presses on "+" from starting one on the parent row.
  const stop = { onPointerDown: (e: PointerEvent) => e.stopPropagation(), onKeyDown: (e: KeyboardEvent) => e.stopPropagation() };
  const status = (
    <span className="sr-only" role="status">
      {added ? `${name} added to ${added}` : ""}
    </span>
  );

  if (!target)
    return (
      <>
        <ActionMenu
          align="end"
          actions={addCourseActions(courseId, plan, hidden).filter((a) => a.label.startsWith("Add to "))}
          trigger={
            <button type="button" {...stop} aria-label={`Add ${name} to a semester`} title="Add to a semester (or select a semester first)" className={cn(base, "border-border text-text-secondary hover:border-accent hover:text-accent")}>
              <PlusIcon size={14} />
            </button>
          }
        />
        {status}
      </>
    );

  const label = termLabel(target);
  return (
    <>
      <button
        type="button"
        {...stop}
        disabled={already && !added}
        onClick={() => {
          planActions.addCourse(target, courseId);
          setAdded(label);
        }}
        aria-label={already ? `${name} is in ${label}` : `Add ${name} to ${label}`}
        title={already ? `Already in ${label}` : `Add to ${label}`}
        className={cn(
          base,
          added || already ? "border-success text-success" : "border-accent bg-accent-soft text-accent hover:bg-accent hover:text-surface",
          already && !added && "cursor-default opacity-70",
        )}
      >
        {added || already ? <CheckIcon size={14} /> : <PlusIcon size={14} />}
      </button>
      {status}
    </>
  );
}
