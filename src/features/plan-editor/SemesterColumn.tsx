"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useState } from "react";
import { formatCredits } from "@/domain/course";
import type { Semester } from "@/domain/plan";
import { termLabel } from "@/domain/terms";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/components/ui/cn";
import { DotsIcon } from "@/components/ui/icons";
import { Menu, MenuItem } from "@/components/ui/Menu";
import { useCreditTotal } from "@/features/catalog/courseCache";
import { CourseCard } from "./CourseCard";
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
  const credits = useCreditTotal(semester.courses.map((c) => c.id));
  const [confirming, setConfirming] = useState(false);
  const label = termLabel(semester.index);

  const selected = useEditorUi((s) => s.selectedTerm === semester.index);
  const mobile = useIsMobile();
  const selectTerm = useEditorUi((s) => s.selectTerm);

  const remove = () => (semester.courses.length ? setConfirming(true) : planActions.removeSemester(semester.index));

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
        <span className="ml-auto flex items-center gap-1.5 text-micro text-text-secondary">
          <WorkloadBadge semester={semester} />
          {formatCredits(credits)} cr
        </span>
        <Menu
          trigger={
            <button type="button" aria-label={`${label} options`} className="rounded-row p-0.5 text-text-tertiary hover:bg-surface hover:text-text-primary">
              <DotsIcon />
            </button>
          }
        >
          <MenuItem danger onSelect={remove}>Remove {label}</MenuItem>
        </Menu>
      </header>
      <SortableContext items={semester.courses.map((c) => plannedId(semester.index, c.id))} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-1 flex-col gap-1.5">
          {semester.courses.map((c, i) => (
            <CourseCard key={c.id} term={semester.index} index={i} planned={c} issues={issues.get(issueKey(semester.index, c.id))} />
          ))}
          {semester.courses.length === 0 && (
            <li className="flex flex-1 list-none items-center justify-center rounded-card border border-dashed border-border-strong/70 py-6 text-micro text-text-tertiary">
              {mobile ? "Add from search or Requirements" : "Drop courses here"}
            </li>
          )}
        </ul>
      </SortableContext>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Remove ${label}?`}
        description={`Its ${semester.courses.length} course${semester.courses.length === 1 ? "" : "s"} will be removed from the plan.`}
        confirmLabel="Remove"
        onConfirm={() => planActions.removeSemester(semester.index)}
      />
    </section>
    </ContextMenu>
  );
}
