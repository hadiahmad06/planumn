"use client";

import { useEffect } from "react";
import type { Plan } from "@/domain/plan";
import { PreviewLayer } from "@/features/preview/PreviewLayer";
import { usePlanStore } from "./store";

/**
 * The whole plan view (top bar, requirements rail, schedule). Owned by Hadi's Claude.
 * Route pages (owned by Michael's Codex) load a plan and render `<PlanEditor initialPlan={plan} />`.
 * Placeholder from the scaffold; the real editor lands in the A2 PR.
 */
export function PlanEditor({ initialPlan }: { initialPlan: Plan }) {
  const loadPlan = usePlanStore((s) => s.loadPlan);
  const plan = usePlanStore((s) => s.plan);
  useEffect(() => loadPlan(initialPlan), [initialPlan, loadPlan]);

  return (
    <main className="p-8">
      <h1 className="text-title font-semibold">{plan?.title || "Untitled plan"}</h1>
      <p className="text-text-secondary">{plan?.semesters.length ?? 0} semesters · editor coming in the A2 PR</p>
      <PreviewLayer />
    </main>
  );
}
