"use client";

import { useState } from "react";
import type { Plan } from "@/domain/plan";
import { SaveStatus } from "@/features/plans/SaveStatus";
import { ProgressWidget } from "@/features/requirements/ProgressWidget";
import { planActions } from "./store";
import { HealthPanel } from "./HealthPanel";
import { ViewOptions } from "./ViewOptions";

/** Inline-editable plan title (A7). Commits on blur or Enter; Escape reverts. */
function EditableTitle({ title }: { title: string }) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft !== null) planActions.setTitle(draft.trim());
    setDraft(null);
  };
  return (
    <input
      value={draft ?? title}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={() => setDraft(title)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setDraft(null);
          requestAnimationFrame(() => (document.activeElement as HTMLElement | null)?.blur());
        }
      }}
      placeholder="Untitled plan"
      aria-label="Plan title"
      maxLength={120}
      className="min-w-56 flex-1 rounded-row bg-transparent text-[24px] leading-tight font-semibold outline-none placeholder:text-text-tertiary hover:bg-surface/60 focus:bg-surface"
    />
  );
}

export function PlanHeader({ plan }: { plan: Plan }) {
  const courseCount = plan.semesters.reduce((n, s) => n + s.courses.length, 0);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <EditableTitle title={plan.title} />
      <div className="flex items-center gap-3 text-text-secondary">
        <span>
          {courseCount} {courseCount === 1 ? "course" : "courses"}
        </span>
        <SaveStatus />
        <ProgressWidget plan={plan} />
        <HealthPanel plan={plan} />
        <ViewOptions />
      </div>
    </div>
  );
}
