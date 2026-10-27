"use client";

import { useState } from "react";
import type { Plan } from "@/domain/plan";
import type { Requirement, Rule } from "@/domain/requirements";
import { CloseIcon } from "@/components/ui/icons";
import { LibEdCoverage } from "@/features/libed/LibEdCoverage";
import { MinorFinder } from "@/features/minors/MinorFinder";
import { planActions } from "@/features/plan-editor/store";
import { loadProgram, usePrograms } from "./programStore";
import { programName } from "./programOptions";
import { DoubleDipFinder } from "./DoubleDipFinder";
import { ProgramPicker } from "./ProgramPicker";
import { RequirementItem } from "./RequirementItem";
import { useAudit } from "./useAudit";

/** Searchable text of a rule: its name, notes, and listed course codes/titles (not JSON keys or ids). */
function ruleText(rule: Rule): string[] {
  const own = [rule.name, rule.notes ?? ""];
  if (rule.kind === "courses") return [...own, ...rule.choices.flatMap((c) => c.options.flatMap((o) => [o.code ?? "", o.title ?? ""]))];
  if (rule.kind === "text") return [...own, rule.text];
  return [...own, ...rule.children.flatMap(ruleText)];
}

/** True if the requirement's name, a rule name/notes, or a listed course code/title matches the filter (A28). */
export function matchesFilter(r: Requirement, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [r.name, r.notes ?? "", ...r.rules.flatMap(ruleText)].some((t) => t.toLowerCase().includes(q));
}

/** Left rail: the plan's programs and their requirements (A22–A28). */
export function RequirementsRail({ plan }: { plan: Plan }) {
  const entries = usePrograms(plan.programs);
  const { results } = useAudit(plan);
  const [query, setQuery] = useState("");
  const [hideDone, setHideDone] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-micro font-semibold tracking-wide text-text-secondary uppercase">Requirements</h2>
        <div className="flex flex-wrap gap-1.5">
          {plan.programs.map((id) => (
            <span key={id} className="flex items-center gap-1 rounded-full bg-accent-soft py-0.5 pr-1 pl-2.5 text-micro text-accent">
              {programName(id)}
              <button type="button" onClick={() => planActions.removeProgram(id)} aria-label={`Remove ${programName(id)}`} className="rounded-full p-0.5 hover:bg-surface">
                <CloseIcon size={10} />
              </button>
            </span>
          ))}
          <ProgramPicker selected={plan.programs} />
        </div>
      </div>

      {plan.programs.length === 0 && (
        <p className="text-text-tertiary">Add a major or minor to see its requirements, then drag courses from here into your semesters.</p>
      )}

      {plan.programs.length > 0 && (
        <div className="flex flex-col gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter requirements or courses"
            aria-label="Filter requirements"
            className="w-full rounded-full border border-border bg-surface px-3 py-1.5 outline-none placeholder:text-text-tertiary focus:border-accent"
          />
          <label className="flex items-center gap-2 text-micro text-text-secondary">
            <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} className="accent-accent" />
            Hide completed requirements
          </label>
        </div>
      )}

      {plan.programs.map((id) => {
        const entry = entries[id];
        const result = results.find((r) => r.program.id === id);
        const shown = result?.requirements.filter((r) => matchesFilter(r.requirement, query) && !(hideDone && r.satisfied)) ?? [];
        return (
          <section key={id} className="flex flex-col gap-2">
            <div className="flex items-baseline gap-2">
              <h3 className="min-w-0 flex-1 font-semibold">{result?.program.name ?? programName(id)}</h3>
              {result && (
                <span className="shrink-0 text-micro text-text-secondary">
                  {result.filled}/{result.units}
                </span>
              )}
            </div>
            {(!entry || entry.status === "loading") && <p className="text-text-tertiary">Loading requirements…</p>}
            {entry?.status === "error" && (
              <p className="text-danger">
                {entry.message}{" "}
                <button type="button" onClick={() => void loadProgram(id, true)} className="underline">
                  Retry
                </button>
              </p>
            )}
            {result && (
              <ul className="flex flex-col gap-1.5">
                {shown.map((r) => (
                  <RequirementItem key={r.requirement.id} result={r} defaultOpen={query.trim().length > 0} />
                ))}
                {shown.length === 0 && <li className="text-text-tertiary">{query ? "No matching requirements" : "All requirements completed"}</li>}
              </ul>
            )}
          </section>
        );
      })}

      <DoubleDipFinder plan={plan} results={results} />

      {/* B3, Ishaan's Claude: Twin Cities Lib Ed designation coverage. */}
      <LibEdCoverage plan={plan} />
      <MinorFinder plan={plan} /> {/* B14, Ishaan's Claude */}
    </div>
  );
}
