"use client";

import { useState } from "react";
import type { Plan } from "@/domain/plan";
import { cn } from "@/components/ui/cn";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { RequirementsRail } from "./RequirementsRail";
import { useAudit } from "./useAudit";

/** Below 768px the rail becomes a collapsible section above the schedule (A32). Collapsed by default. */
export function MobileRailSection({ plan }: { plan: Plan }) {
  const [open, setOpen] = useState(false);
  const { met, total } = useAudit(plan);
  return (
    <section className="rounded-card bg-surface shadow-card">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-2 px-3 py-2.5 text-left">
        <ProgressRing value={met} total={total} />
        <span className="flex-1 font-semibold">Requirements</span>
        {total > 0 && (
          <span className="text-micro text-text-secondary">
            {met}/{total}
          </span>
        )}
        <span aria-hidden className={cn("text-micro text-text-tertiary transition-transform", open && "rotate-90")}>▶</span>
      </button>
      {open && (
        <div className="border-t border-border p-3">
          <RequirementsRail plan={plan} />
        </div>
      )}
    </section>
  );
}
