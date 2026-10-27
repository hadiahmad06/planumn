"use client";

import { useState } from "react";
import { admissionChecklist, type AdmissionItem } from "@/domain/admission";
import type { Plan } from "@/domain/plan";
import type { ProgramResult } from "@/domain/requirements";
import { termLabel } from "@/domain/terms";
import { cn } from "@/components/ui/cn";

const when = (t: AdmissionItem["plannedBy"]) => (t === "prior" ? "prior credit" : t ? termLabel(t) : null);

function Row({ item }: { item: AdmissionItem }) {
  const { result } = item;
  const done = result.satisfied;
  return (
    <li className="flex gap-2">
      <span aria-hidden className={cn("mt-1.5 size-2 shrink-0 rounded-full", done ? "bg-success" : "border border-border-strong")} />
      <div className="min-w-0 flex-1">
        <p className={cn(done ? "text-text-primary" : "text-text-secondary")}>
          {result.requirement.name}
          <span className="sr-only">{done ? ": in plan" : ": not in plan yet"}</span>
        </p>
        <p className="text-micro text-text-secondary">
          {done ? `Planned by ${when(item.plannedBy) ?? "…"}` : `${result.filled}/${result.units} planned. See the requirement below.`}
        </p>
      </div>
    </li>
  );
}

/**
 * Admission to the major (B26): the courses the catalog says a student must take before applying
 * (CourseDog's "Program Admission Requirements"), and when the plan has them. Grades, GPA and deadlines
 * can't be checked, so the catalog's own text is shown as written.
 */
export function AdmissionChecklist({ plan, result }: { plan: Plan; result: ProgramResult }) {
  const [open, setOpen] = useState(true);
  const [showText, setShowText] = useState(false);
  const checklist = admissionChecklist(result, plan.semesters);
  if (!checklist) return null;
  const { items, met, notes, links } = checklist;

  return (
    <div role="group" className="flex flex-col gap-2 rounded-row border border-border p-2.5" aria-label={`Admission to ${result.program.name}`}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex items-baseline gap-2 text-left">
        <h4 className="min-w-0 flex-1 text-micro font-semibold tracking-wide text-text-secondary uppercase">Admission to the major</h4>
        {items.length > 0 && (
          <span className="shrink-0 text-micro text-text-secondary">
            {met}/{items.length} in plan
          </span>
        )}
        <span aria-hidden className={cn("text-micro text-text-tertiary transition-transform", open && "rotate-90")}>▶</span>
      </button>
      {open && (
        <>
          {items.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {items.map((i) => (
                <Row key={i.result.requirement.id} item={i} />
              ))}
            </ul>
          ) : (
            <p className="text-micro text-text-secondary">The catalog describes this major&apos;s admission courses in text only (below).</p>
          )}
          {checklist.plannedBy && (
            <p className="text-micro text-text-secondary">All admission courses are planned by {when(checklist.plannedBy)}.</p>
          )}
          <p className="text-micro text-text-tertiary">
            From the UMN catalog. &ldquo;In plan&rdquo; means planned, not passed: planu.mn can&apos;t check minimum
            grades, your GPA or application deadlines. Your college decides admission.
          </p>
          {notes && (
            <button type="button" onClick={() => setShowText(!showText)} aria-expanded={showText} className="self-start text-micro text-accent underline">
              {showText ? "Hide" : "Show"} what the catalog says
            </button>
          )}
          {notes && showText && <p className="text-micro whitespace-pre-line text-text-secondary">{notes}</p>}
          {links.length > 0 && (
            <ul className="flex flex-wrap gap-x-3 gap-y-1 text-micro">
              {links.map((l) => (
                <li key={l.url}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-accent underline">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
