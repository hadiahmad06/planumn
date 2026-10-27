"use client";

import type { Plan } from "@/domain/plan";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { useAudit } from "./useAudit";

/** "13 / 25 requirements met" in the plan header (A26). Same units as the rail's x/y counts. */
export function ProgressWidget({ plan }: { plan: Plan }) {
  const { met, total, results } = useAudit(plan);
  if (results.length === 0 || total === 0) return null;
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1" title="Requirements met across your programs">
      <ProgressRing value={met} total={total} size={16} />
      <span>
        <strong className="text-text-primary">{met}</strong>/{total} requirements
      </span>
    </span>
  );
}
