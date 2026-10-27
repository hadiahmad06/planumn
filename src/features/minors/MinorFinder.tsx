"use client";

import { useState } from "react";
import { plannedCourseIds, type Plan } from "@/domain/plan";
import { cn } from "@/components/ui/cn";
import { planActions } from "@/features/plan-editor/store";

interface MinorResult {
  id: string;
  name: string;
  matched: { id: number; code: string }[];
  filled: number;
  units: number;
}

type State =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "done"; key: string; checked: number; minors: MinorResult[] }
  | { phase: "error"; message: string };

const SHOWN = 5;

/**
 * Minor finder (B14). Written by Ishaan's Claude. Ranks UMN minors by how many planned courses already
 * count toward them. Loads nothing until the student asks: the first search reads ~300 minors from the
 * UMN catalog (cached on the server for days).
 */
export function MinorFinder({ plan }: { plan: Plan }) {
  const [state, setState] = useState<State>({ phase: "idle" });
  const [open, setOpen] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const ids = plannedCourseIds(plan);
  const key = `${[...ids].sort((a, b) => a - b).join(",")}|${[...plan.programs].sort().join(",")}`;

  const find = async () => {
    if (ids.length === 0) return;
    setState({ phase: "loading" });
    setShowAll(false);
    try {
      const params = new URLSearchParams({ ids: ids.join(",") });
      if (plan.programs.length) params.set("exclude", plan.programs.join(","));
      const res = await fetch(`/api/minors?${params}`);
      const body = await res.json().catch(() => ({ error: `Minor search failed (${res.status}).` }));
      if (!res.ok) throw new Error(body.error ?? `Minor search failed (${res.status}).`);
      setState({ phase: "done", key, checked: body.checked, minors: body.minors });
    } catch (e) {
      setState({ phase: "error", message: e instanceof Error ? e.message : "Minor search failed." });
    }
  };

  const stale = state.phase === "done" && state.key !== key;
  const visible = state.phase === "done" ? (showAll ? state.minors : state.minors.slice(0, SHOWN)) : [];

  return (
    <section className="flex flex-col gap-2 border-t border-border pt-4" aria-label="Minor finder">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex items-baseline gap-2 text-left">
        <h3 className="min-w-0 flex-1 font-semibold">Minor finder</h3>
        {state.phase === "done" && !stale && <span className="shrink-0 text-micro text-text-secondary">{state.minors.length} with overlap</span>}
        <span aria-hidden className={cn("text-micro text-text-tertiary transition-transform", open && "rotate-90")}>▶</span>
      </button>
      {open && (
        <>
          <p className="text-micro text-text-tertiary">
            Minors your planned courses already count toward. Whether a course may count toward both your major and a
            minor is your college&apos;s rule, so check with your advisor.
          </p>
          {ids.length === 0 ? (
            <p className="text-text-tertiary">Plan a few courses first.</p>
          ) : state.phase === "idle" || stale ? (
            <button type="button" onClick={() => void find()} className="self-start rounded-row border border-border-strong px-3 py-1.5 text-sm hover:border-accent hover:text-accent">
              {stale ? "Plan changed: search again" : "Find minors that fit my plan"}
            </button>
          ) : state.phase === "loading" ? (
            <p role="status" className="text-text-tertiary">
              Checking UMN minors… the first search can take a few seconds.
            </p>
          ) : state.phase === "error" ? (
            <p className="text-micro text-danger">
              {state.message}{" "}
              <button type="button" onClick={() => void find()} className="underline">
                Retry
              </button>
            </p>
          ) : state.minors.length === 0 ? (
            <p className="text-text-tertiary">None of {state.checked} minors list your planned courses yet.</p>
          ) : null}
          {state.phase === "done" && !stale && state.minors.length > 0 && (
            <ul className="flex flex-col gap-2">
              {visible.map((m) => (
                <li key={m.id} className="flex flex-col gap-0.5 rounded-row bg-sunken/60 px-2 py-1.5">
                  <div className="flex items-baseline gap-2">
                    <span className="min-w-0 flex-1 font-medium">{m.name}</span>
                    <button
                      type="button"
                      onClick={() => planActions.addProgram(m.id)}
                      className="shrink-0 text-micro text-accent underline"
                      aria-label={`Add ${m.name} to my programs`}
                    >
                      Add
                    </button>
                  </div>
                  <span className="text-micro text-text-secondary">
                    {m.matched.length} of your courses count: {m.matched.map((c) => c.code).join(", ")}
                    {m.units > 0 && ` · ${m.filled}/${m.units} requirements met`}
                  </span>
                </li>
              ))}
              {state.minors.length > SHOWN && (
                <li>
                  <button type="button" onClick={() => setShowAll(!showAll)} className="text-micro text-accent underline">
                    {showAll ? "Show fewer" : `Show all ${state.minors.length}`}
                  </button>
                </li>
              )}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
