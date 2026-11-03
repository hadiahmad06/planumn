"use client";

import { useEffect, useState } from "react";
import { createEmptyPlan } from "@/domain/plan";
import type { Plan } from "@/domain/plan";
import { PlanEditor } from "@/features/plan-editor/PlanEditor";
import { LocalPlanRepository } from "@/features/plans/localRepository";
import Link from "next/link";

export function NewPlan() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [existing, setExisting] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    new LocalPlanRepository(window.localStorage)
      .get("autosave")
      .then((saved) => {
        if (active) {
          if (saved) setExisting(true);
          else setPlan(createEmptyPlan());
        }
      })
      .catch((e) => {
        if (active) {
          setError(
            e instanceof Error ? e.message : "Autosave could not be read.",
          );
          setExisting(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);
  if (plan) return <PlanEditor initialPlan={plan} />;
  if (!existing)
    return (
      <p role="status" className="p-8">
        Checking for an autosave…
      </p>
    );
  return (
    <main className="mx-auto max-w-lg space-y-5 p-8">
      <h1 className="text-title font-semibold">Keep your current autosave?</h1>
      <p>
        {error ||
          "Starting a new plan will replace the autosave in this browser. Your cloud plans are kept."}
      </p>
      <Link href="/plan/autosave" className="block text-accent underline">
        Resume autosave
      </Link>
      <button
        type="button"
        onClick={() => setPlan(createEmptyPlan())}
        className="rounded-row bg-accent px-4 py-2 text-surface"
      >
        Replace autosave and start a plan
      </button>
    </main>
  );
}
