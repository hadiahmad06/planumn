"use client";

import { useState } from "react";
import type { ApasAudit } from "@/domain/apas";
import { describeApasStatus, nameMatch, type ApasComparison, type ApasPair } from "@/domain/apasCompare";
import { cn } from "@/components/ui/cn";

/**
 * Phase C/C4 (Hadi's Claude): APAS's own result next to planu.mn's estimate, when an audit was imported
 * in this tab. Display only; planu.mn's progress doesn't change.
 */

const SOURCE =
  "APAS's own result, from the audit you imported in this tab. planu.mn's side here uses only this plan's courses that are also on that audit: future courses don't count, and a course on the audit that isn't in this plan counts as missing.";

function planumnSide(pair: ApasPair): string {
  if (pair.verdict === "unchecked") return "planu.mn can't check this one";
  const met = pair.target.satisfied ? "met" : "not met";
  return pair.verdict === "agree" ? `planu.mn agrees (${met})` : `planu.mn: ${met} with the same courses`;
}

/** "APAS says: not complete, needs 10 credits · planu.mn: met with the same courses". */
export function ApasSaysLine({ pair }: { pair: ApasPair }) {
  const renamed = nameMatch(pair.apas.title, pair.target.name) < 1;
  return (
    <p title={SOURCE} className="text-micro text-text-secondary">
      <span className="font-medium">APAS says:</span> {describeApasStatus(pair.apas)}
      {renamed && <span className="text-text-tertiary"> (APAS&apos;s &ldquo;{pair.apas.title}&rdquo;)</span>}
      <span className={cn(pair.verdict === "disagree" ? "font-medium text-warning" : "text-text-tertiary")}> · {planumnSide(pair)}</span>
    </p>
  );
}

/** One line per program: how many paired requirements disagree, and what didn't pair. */
export function ApasProgramSummary({ audit, comparison }: { audit: ApasAudit; comparison: ApasComparison }) {
  const [open, setOpen] = useState(false);
  const { pairs, disagreements, apasOnly, planumnOnly } = comparison;
  const unchecked = pairs.filter((p) => p.verdict === "unchecked").length;
  return (
    <div className="rounded-row border border-dashed border-border px-2 py-1.5 text-micro" title={SOURCE}>
      <p className="text-text-secondary">
        <span className="font-medium">Compared with your APAS audit</span>
        {audit.preparedOn ? ` (prepared ${audit.preparedOn})` : ""}:{" "}
        <span className={cn(disagreements > 0 && "font-medium text-warning")}>
          {disagreements} disagreement{disagreements === 1 ? "" : "s"}
        </span>{" "}
        in {pairs.length} matched requirement{pairs.length === 1 ? "" : "s"}
        {unchecked ? `, ${unchecked} planu.mn can't check` : ""}.
      </p>
      <p className="text-text-tertiary">
        APAS is the official audit; this tab only. Requirements are matched by name.{" "}
        <button type="button" onClick={() => setOpen(!open)} className="text-accent hover:underline" aria-expanded={open}>
          {open ? "Hide details" : "Details"}
        </button>
      </p>
      {open && (
        <div className="mt-1 flex flex-col gap-1 text-text-secondary">
          {disagreements > 0 && (
            <p>
              Disagree:{" "}
              {pairs
                .filter((p) => p.verdict === "disagree")
                .map((p) => `${p.target.name} (APAS: ${describeApasStatus(p.apas)})`)
                .join("; ")}
            </p>
          )}
          {apasOnly.length > 0 && <p>Only in APAS: {apasOnly.map((r) => r.title).join("; ")}</p>}
          {planumnOnly.length > 0 && <p>No APAS match: {planumnOnly.map((r) => r.name).join("; ")}</p>}
        </div>
      )}
    </div>
  );
}
