"use client";

import { useMemo } from "react";
import type {
  ApasAudit,
  ApasCourse,
  ApasCourseKind,
  ApasRequirement,
  ApasStatus,
} from "@/domain/apas";
import { compareTerms, termLabel } from "@/domain/terms";
import { cn } from "@/components/ui/cn";
import { ApasPlanStep } from "./ApasPlanStep";
import { parseApasHtml } from "./parseReport";

const KIND_LABEL: Record<ApasCourseKind, string> = {
  completed: "Completed",
  "in-progress": "In progress",
  planned: "Planned",
  exam: "AP/IB/exam",
  transfer: "Transfer",
  withdrawn: "Withdrawn",
  "no-credit": "No credit",
};

const STATUS: Record<ApasStatus, { label: string; dot: string }> = {
  complete: { label: "Complete", dot: "bg-success" },
  "in-progress": {
    label: "Complete with in-progress courses",
    dot: "bg-warning",
  },
  incomplete: { label: "Not complete", dot: "bg-danger" },
  none: { label: "", dot: "border border-border-strong" },
};

const term = (c: ApasCourse) =>
  c.term ? termLabel(c.term) : c.termRaw || "Unknown term";

/** Our credit sums next to the audit's own "Minimum Degree Credits" totals, as a parse check. */
function CreditCheck({ audit }: { audit: ApasAudit }) {
  const ours = {
    earned: audit.courses
      .filter((c) => c.earnedCredit)
      .reduce((n, c) => n + c.credits, 0),
    inProgress: audit.courses
      .filter((c) => c.kind === "in-progress")
      .reduce((n, c) => n + c.credits, 0),
  };
  const degree = audit.requirements.find((r) =>
    /minimum degree credits/i.test(r.title),
  );
  const row = (
    label: string,
    mine: number,
    theirs: number | null | undefined,
  ) => (
    <li className={cn(theirs != null && theirs !== mine && "text-danger")}>
      {label}: {mine}
      {theirs != null &&
        (theirs === mine
          ? ` (matches APAS)`
          : ` (APAS says ${theirs}: check the course list)`)}
    </li>
  );
  return (
    <ul className="space-y-0.5 text-sm text-text-secondary">
      {row("Credits earned", ours.earned, degree?.earned.credits)}
      {row("Credits in progress", ours.inProgress, degree?.inProgress.credits)}
    </ul>
  );
}

function Requirement({ r }: { r: ApasRequirement }) {
  const s = STATUS[r.status];
  const open = r.subrequirements.filter((x) => x.status === "incomplete");
  const needs = [
    r.needs?.credits != null && `${r.needs.credits} credits`,
    r.needs?.courses != null && `${r.needs.courses} courses`,
  ]
    .filter(Boolean)
    .join(", ");
  return (
    <li className="flex gap-2">
      <span
        aria-hidden
        className={cn("mt-1.5 size-2 shrink-0 rounded-full", s.dot)}
      />
      <div className="min-w-0 flex-1">
        <p className={cn(r.status === "none" && "font-semibold")}>
          {r.title}
          {s.label && <span className="sr-only">: {s.label}</span>}
          {needs && (
            <span className="text-sm text-text-secondary">
              {" "}
              · needs {needs}
            </span>
          )}
        </p>
        {open.map((x, i) => (
          <p key={i} className="text-sm text-text-secondary">
            {x.required && <strong>R </strong>}
            {x.title}
            {x.options.length > 0 &&
              ` Options: ${x.options.slice(0, 12).join(", ")}${x.options.length > 12 ? ` and ${x.options.length - 12} more` : ""}.`}
          </p>
        ))}
      </div>
    </li>
  );
}

/**
 * What planu.mn read from the APAS report (B1 step 2), so the student can check it against APAS before
 * anything turns into a plan. Written by Hadi's Claude. Parsed in this tab; nothing is uploaded.
 */
export function ParsedAudit({ html }: { html: string }) {
  const audit = useMemo(() => parseApasHtml(html), [html]);
  if (!audit) {
    return (
      <section className="my-8 rounded-card border border-border-strong bg-surface p-6">
        <p>
          This page isn&apos;t an APAS audit report, so there&apos;s nothing to
          read. Open a completed audit (APAS → View Previous APAS → View APAS)
          and send that page.
        </p>
      </section>
    );
  }
  const byTerm = Object.entries(
    Object.groupBy(
      [...audit.courses].sort(
        (a, b) =>
          compareTerms(a.term ?? "0", b.term ?? "0") ||
          a.code.localeCompare(b.code),
      ),
      term,
    ),
  );
  return (
    <>
      <section
        className="my-8 space-y-6 rounded-card border border-border-strong bg-surface p-6"
        aria-label="What planu.mn read"
      >
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">What planu.mn read</h2>
          <p className="text-sm text-text-secondary">
            Check this against your APAS before anything becomes a plan.
            It&apos;s read from the report in this tab and isn&apos;t saved or
            uploaded.
          </p>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-text-secondary">Program</dt>
          <dd>
            {audit.program.title} ({audit.program.code})
          </dd>
          <dt className="text-text-secondary">Catalog year</dt>
          <dd>
            {audit.catalogTerm ? termLabel(audit.catalogTerm) : "Not found"}
          </dd>
          <dt className="text-text-secondary">Expected graduation</dt>
          <dd>
            {audit.expectedGradTerm
              ? termLabel(audit.expectedGradTerm)
              : "Not found"}
          </dd>
          <dt className="text-text-secondary">Prepared</dt>
          <dd>{audit.preparedOn ?? "Not found"}</dd>
        </dl>
        <CreditCheck audit={audit} />

        <div className="space-y-2">
          <h3 className="font-semibold">Courses ({audit.courses.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-text-secondary">
                <tr>
                  <th className="py-1 pr-3 font-normal">Term</th>
                  <th className="py-1 pr-3 font-normal">Course</th>
                  <th className="py-1 pr-3 font-normal">Title</th>
                  <th className="py-1 pr-3 font-normal">Credits</th>
                  <th className="py-1 pr-3 font-normal">Grade</th>
                  <th className="py-1 font-normal">Counts as</th>
                </tr>
              </thead>
              <tbody>
                {byTerm.flatMap(([t, courses]) =>
                  (courses ?? []).map((c, i) => (
                    <tr
                      key={`${t}-${c.code}-${c.grade}`}
                      className={cn(
                        "border-t border-border",
                        !c.earnedCredit &&
                          c.kind !== "in-progress" &&
                          "text-text-tertiary",
                      )}
                    >
                      <td className="py-1 pr-3 whitespace-nowrap">
                        {i === 0 ? t : ""}
                      </td>
                      <td className="py-1 pr-3 whitespace-nowrap">{c.code}</td>
                      <td className="py-1 pr-3">
                        {c.title}
                        {c.notes.length > 0 && (
                          <span className="text-text-tertiary">
                            {" "}
                            · {c.notes.join(" · ")}
                          </span>
                        )}
                      </td>
                      <td className="py-1 pr-3">{c.credits}</td>
                      <td className="py-1 pr-3">{c.grade}</td>
                      <td className="py-1 whitespace-nowrap">
                        {KIND_LABEL[c.kind]}
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Requirements</h3>
          <ul className="space-y-1.5">
            {audit.requirements.map((r, i) => (
              <Requirement key={`${r.id}-${i}`} r={r} />
            ))}
          </ul>
        </div>
      </section>
      <ApasPlanStep audit={audit} />
    </>
  );
}
