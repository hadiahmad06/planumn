"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ApasAudit } from "@/domain/apas";
import {
  apasPlanFromAudits,
  type ApasPlanResult,
  type ApasSkipReason,
} from "@/domain/apasPlan";
import { termLabel } from "@/domain/terms";
import { LocalPlanRepository } from "@/features/plans/localRepository";
import {
  PROGRAM_OPTIONS,
  programName,
} from "@/features/requirements/programOptions";

const SKIP: Record<ApasSkipReason, string> = {
  withdrawn: "withdrawn",
  "no-credit": "no credit",
  failed: "no credit earned (failing grade)",
  "no-term": "term not recognized",
  duplicate: "listed twice in the same term",
  "slot-limit": "that term already has the maximum 20 placeholder slots",
};

/** Catalog ids for course codes, looked up on the server. Only the codes are sent. */
async function lookupCodes(codes: string[]): Promise<Map<string, number>> {
  const res = await fetch("/api/courses/by-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codes }),
  });
  const data = (await res.json().catch(() => null)) as {
    ids?: Record<string, number>;
    error?: string;
  } | null;
  if (!res.ok || !data?.ids)
    throw new Error(data?.error ?? "Couldn't look up the courses. Try again.");
  return new Map(Object.entries(data.ids));
}

/**
 * Build a new plan from a parsed APAS audit and open it (B1). Written by Hadi's Claude. The plan is shown
 * for review first; opening it replaces this browser's autosave (after confirmation, like transcript
 * import), and the editor takes it from there.
 */
export function ApasPlanStep({ audits }: { audits: readonly ApasAudit[] }) {
  const router = useRouter();
  // A result belongs to the reports it was built from: adding or replacing a report asks for a rebuild.
  const [built, setBuilt] = useState<{ from: readonly ApasAudit[]; result: ApasPlanResult } | null>(null);
  const result = built?.from === audits ? built.result : null;
  const setResult = (r: ApasPlanResult | null) => setBuilt(r && { from: audits, result: r });
  const heading =
    audits.length > 1
      ? `Create one plan from these ${audits.length} reports`
      : "Create a plan from this report";
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [existing, setExisting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    new LocalPlanRepository(window.localStorage)
      .get("autosave")
      .then((plan) => setExisting(Boolean(plan)))
      .catch(() => setExisting(true));
  }, []);

  async function build() {
    setPending(true);
    setError("");
    try {
      const ids = await lookupCodes([
        ...new Set(audits.flatMap((a) => a.courses.map((c) => c.code))),
      ]);
      setResult(
        apasPlanFromAudits(
          audits,
          ids,
          PROGRAM_OPTIONS.map((p) => p.id),
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't build the plan.");
    } finally {
      setPending(false);
    }
  }

  async function open() {
    if (!result) return;
    try {
      await new LocalPlanRepository(window.localStorage).save(result.plan);
      router.push("/plan/autosave");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Couldn't save the plan in this browser.",
      );
    }
  }

  return (
    <section
      className="my-8 space-y-4 rounded-card border border-border-strong bg-surface p-6"
      aria-label={heading}
    >
      <h2 className="text-lg font-semibold">{heading}</h2>
      <p className="text-sm text-text-secondary">
        Courses go into the terms APAS lists, locked in place. AP, IB and exam
        credit, and transfer credit from before your first term at the U, go
        into a &ldquo;prior credit&rdquo; semester. Only the course codes are
        sent to planu.mn to look them up in the catalog; grades and your record
        stay in this tab.
      </p>
      {!result && (
        <button
          type="button"
          onClick={() => void build()}
          disabled={pending}
          className="rounded-row bg-accent px-4 py-2 font-medium text-surface hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Matching courses…" : "Build the plan"}
        </button>
      )}
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      {result && (
        <div className="space-y-3 text-sm">
          <ul className="space-y-1">
            <li>{result.matched} courses matched the catalog.</li>
            {result.programs.map((p, i) => (
              <li key={`${p.apasCode}-${i}`}>
                Program:{" "}
                {p.programId
                  ? `${programName(p.programId)} (from APAS "${p.title}")`
                  : `"${p.title}" has no matching planu.mn program. Add your programs in the editor.`}
              </li>
            ))}
            {result.shared > 0 && (
              <li>
                {result.shared} course{result.shared === 1 ? "" : "s"} on more
                than one report in the same term: each is added once, as the
                most recently prepared report lists it.
              </li>
            )}
            <li>
              Plan:{" "}
              {termLabel(
                result.plan.semesters.find((s) => s.kind !== "prior")!.index,
              )}{" "}
              to {termLabel(result.plan.semesters.at(-1)!.index)}
              {audits.some((a) => a.expectedGradTerm)
                ? " (your expected graduation term)"
                : ""}
              .
            </li>
          </ul>
          {result.placeholders.length > 0 && (
            <p className="text-text-secondary">
              Not in planu.mn&apos;s course data, so added as placeholder slots
              with their APAS credits:{" "}
              {result.placeholders.map((p) => p.code).join(", ")}.
            </p>
          )}
          {result.skipped.length > 0 && (
            <p className="text-text-secondary">
              Left out:{" "}
              {result.skipped
                .map((s) => `${s.code} (${s.termRaw}, ${SKIP[s.reason]})`)
                .join(", ")}
              .
            </p>
          )}
          {existing && (
            <label className="flex items-start gap-3 rounded-row bg-warning-soft p-4">
              <input
                type="checkbox"
                className="mt-1"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              <span>
                Replace the plan autosaved in this browser with this one. Plans
                saved to your account are kept.
              </span>
            </label>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void open()}
              disabled={existing && !confirmed}
              className="rounded-row bg-accent px-4 py-2 font-medium text-surface hover:bg-accent-hover disabled:opacity-60"
            >
              Open the plan
            </button>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="rounded-row border border-border-strong px-4 py-2"
            >
              Start over
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
