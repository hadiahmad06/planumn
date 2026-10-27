"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useState } from "react";
import { formatCredits } from "@/domain/course";
import { placeholderCredits, SEMESTER_KINDS, semesterKindLabel, type Semester } from "@/domain/plan";
import { termLabel } from "@/domain/terms";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/components/ui/cn";
import { DotsIcon } from "@/components/ui/icons";
import { Menu, MenuItem } from "@/components/ui/Menu";
import { useCreditTotal } from "@/features/catalog/courseCache";
import { CourseCard } from "./CourseCard";
import { PlaceholderCard } from "./PlaceholderCard";
import { PlaceholderDialog } from "./PlaceholderDialog";
import { WorkloadBadge } from "./WorkloadBadge";
import { plannedId, semesterId, type DropData } from "./dnd";
import { issueKey } from "./useHealth";
import type { HealthIssue } from "@/domain/health";
import { planActions, useEditorUi } from "./store";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { useIsMobile } from "@/hooks/useIsMobile";

export function SemesterColumn({ semester, issues }: { semester: Semester; issues: Map<string, HealthIssue[]> }) {
  const data: DropData = { type: "semester", term: semester.index };
  const { setNodeRef, isOver } = useDroppable({ id: semesterId(semester.index), data });
  const courseCredits = useCreditTotal(semester.courses.map((c) => c.id));
  // B2: placeholder slots count toward the semester's credits.
  const slots = semester.placeholders ?? [];
  const slotCredits = placeholderCredits(semester);
  const credits = { min: courseCredits.min + slotCredits, max: courseCredits.max + slotCredits };
  const [confirming, setConfirming] = useState(false);
  const [addingSlot, setAddingSlot] = useState(false);
  const label = termLabel(semester.index);

  const selected = useEditorUi((s) => s.selectedTerm === semester.index);
  const mobile = useIsMobile();
  const selectTerm = useEditorUi((s) => s.selectTerm);

  const kindLabel = semesterKindLabel(semester.kind);
  const prior = semester.kind === "prior";
  const remove = () => (semester.courses.length || slots.length ? setConfirming(true) : planActions.removeSemester(semester.index));

  return (
    // Right-clicking a course opens the course menu instead (Radix skips the outer menu then).
    <ContextMenu actions={[{ label: `Remove ${label}`, run: remove, danger: true }]}>
    <section
      ref={setNodeRef}
      aria-label={label}
      className={cn(
        "flex min-h-40 min-w-0 flex-col rounded-card border bg-sunken/60 p-2 transition-colors",
        isOver ? "border-accent bg-accent-soft/60" : selected ? "border-accent" : "border-transparent",
      )}
    >
      <header className="mb-2 flex items-center gap-2 px-1">
        <h3>
          <button
            type="button"
            onClick={() => selectTerm(selected ? null : semester.index)}
            aria-pressed={selected}
            title={selected ? "Deselect" : "Select: Enter in search adds courses here"}
            className={cn(
              "rounded-row text-micro font-semibold tracking-wide uppercase hover:text-accent",
              selected ? "text-accent" : "text-text-secondary",
            )}
          >
            {label}
          </button>
        </h3>
        {kindLabel && (
          <span className="rounded-full bg-accent-soft px-1.5 py-px text-[10px] font-medium text-accent" title={`${label}: ${kindLabel}`}>
            {kindLabel}
          </span>
        )}
        <span className="ml-auto flex items-center gap-1.5 text-micro text-text-secondary">
          {!prior && <WorkloadBadge semester={semester} />}
          {formatCredits(credits)} cr
        </span>
        <Menu
          trigger={
            <button type="button" aria-label={`${label} options`} className="rounded-row p-0.5 text-text-tertiary hover:bg-surface hover:text-text-primary">
              <DotsIcon />
            </button>
          }
        >
          <MenuItem onSelect={() => setAddingSlot(true)}>Add placeholder…</MenuItem>
          {!prior && SEMESTER_KINDS.filter((k) => k.kind !== semester.kind).map((k) => (
            <MenuItem key={k.kind} onSelect={() => planActions.setSemesterKind(semester.index, k.kind)}>
              Mark as {k.label.toLowerCase()}
            </MenuItem>
          ))}
          {semester.kind && !prior && <MenuItem onSelect={() => planActions.setSemesterKind(semester.index, null)}>Mark as regular semester</MenuItem>}
          <MenuItem danger onSelect={remove}>Remove {label}</MenuItem>
        </Menu>
      </header>
      <SortableContext items={semester.courses.map((c) => plannedId(semester.index, c.id))} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-1 flex-col gap-1.5">
          {semester.courses.map((c, i) => (
            <CourseCard key={c.id} term={semester.index} index={i} planned={c} issues={issues.get(issueKey(semester.index, c.id))} />
          ))}
          {slots.map((slot) => (
            <PlaceholderCard key={slot.key} term={semester.index} slot={slot} />
          ))}
          {semester.courses.length === 0 && slots.length === 0 && (
            <li className="flex flex-1 list-none items-center justify-center rounded-card border border-dashed border-border-strong/70 py-6 text-micro text-text-tertiary">
              {prior
                ? "Drag the UMN equivalents of AP, IB or transfer courses here, or add a placeholder"
                : mobile
                  ? "Add from search or Requirements"
                  : "Drop courses here"}
            </li>
          )}
        </ul>
      </SortableContext>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Remove ${label}?`}
        description={`Its ${semester.courses.length} course${semester.courses.length === 1 ? "" : "s"}${slots.length ? ` and ${slots.length} placeholder${slots.length === 1 ? "" : "s"}` : ""} will be removed from the plan.`}
        confirmLabel="Remove"
        onConfirm={() => planActions.removeSemester(semester.index)}
      />
      <PlaceholderDialog term={semester.index} open={addingSlot} onOpenChange={setAddingSlot} />
    </section>
    </ContextMenu>
  );
}
