"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Plan } from "@/domain/plan";
import { PlanEditor } from "@/features/plan-editor/PlanEditor";
import { CloudPlanRepository, PlanRequestError } from "./clientRepository";
import { LocalPlanRepository } from "./localRepository";
/** Written by Michael's Codex. Stale requests cannot replace a newer route's plan. */
export function PlanLoader({
  id,
  local = false,
}: {
  id: string;
  local?: boolean;
}) {
  const [state, setState] = useState<{
    plan?: Plan;
    error?: string;
    signIn?: boolean;
  }>({});
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    const repo = local
      ? new LocalPlanRepository(window.localStorage)
      : new CloudPlanRepository();
    repo
      .get(id)
      .then((plan) => {
        if (!active) return;
        if (!plan)
          setState({
            error: local
              ? "No autosave was found in this browser."
              : "Plan not found, or you do not have access.",
          });
        else if (plan.deletion_scheduled_at)
          setState({
            error:
              "This plan is in the recycle bin. Recover it from My Plans to edit it.",
          });
        else setState({ plan });
      })
      .catch((error) => {
        if (active)
          setState({
            error:
              error instanceof Error
                ? error.message
                : "This plan could not be loaded.",
            signIn: error instanceof PlanRequestError && error.status === 401,
          });
      });
    return () => {
      active = false;
    };
  }, [id, local, attempt]);
  if (state.plan) return <PlanEditor initialPlan={state.plan} />;
  if (state.error)
    return (
      <main className="mx-auto max-w-lg space-y-4 p-8">
        <h1 className="text-xl font-semibold">Your plan could not be opened</h1>
        <p role="alert">{state.error}</p>
        {state.signIn && (
          <Link
            href={`/auth?next=${encodeURIComponent(`/plan/${id}`)}`}
            className="block text-accent underline"
          >
            Sign in
          </Link>
        )}
        <button
          className="mr-4 text-accent underline"
          onClick={() => {
            setState({});
            setAttempt((n) => n + 1);
          }}
        >
          Try again
        </button>
        <Link href="/plans" className="text-accent underline">
          My Plans
        </Link>
        <Link href="/plan/new" className="block text-accent underline">
          Start a new plan
        </Link>
      </main>
    );
  return (
    <div role="status" className="space-y-4 p-8">
      <p>Loading your plan…</p>
      <div className="h-72 animate-pulse rounded-card bg-sunken motion-reduce:animate-none" />
    </div>
  );
}
