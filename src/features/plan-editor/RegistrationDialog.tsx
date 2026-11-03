"use client";

import { useState } from "react";
import { courseCode, formatCredits } from "@/domain/course";
import { offeringHistory, offeredInSeason } from "@/domain/health";
import { placeholderCredits, type Semester } from "@/domain/plan";
import { sumCredits } from "@/domain/planOps";
import { termLabel } from "@/domain/terms";
import { Modal } from "@/components/ui/Modal";
import { useCourses } from "@/features/catalog/courseCache";

const SCHEDULE_BUILDER = "https://schedulebuilder.umn.edu/";

/**
 * Registration handoff (Phase B: B16). Written by Hadi's Claude. A semester's courses as a checklist to
 * take into Schedule Builder / MyU: codes to copy, catalog links, and a heads-up for courses that
 * haven't historically run that season. planu.mn never signs in or registers for the student.
 */
export function RegistrationDialog({ semester, open, onOpenChange }: { semester: Semester; open: boolean; onOpenChange: (open: boolean) => void }) {
  const ids = semester.courses.map((c) => c.id);
  const courses = useCourses(open ? ids : []);
  const [copied, setCopied] = useState(false);
  const label = termLabel(semester.index);
  const rows = semester.courses.map((pc) => ({ pc, c: courses[pc.id] }));
  const codes = rows.flatMap(({ c }) => (c ? [courseCode(c)] : []));
  const credits = sumCredits(rows.flatMap(({ c }) => (c ? [c.credits] : [])));
  const slots = semester.placeholders ?? [];

  const copy = () => {
    const text = codes.join(", ");
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => window.prompt("Copy the course codes:", text));
    else window.prompt("Copy the course codes:", text);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={`Register for ${label}`} description="Take this list into Schedule Builder or MyU to pick sections and register. planu.mn doesn't register for you.">
      <div className="flex flex-col gap-4">
        {rows.length === 0 ? (
          <p className="text-text-secondary">No courses planned for {label} yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {rows.map(({ pc, c }) => {
              const offered = c ? offeredInSeason(offeringHistory(c.termsOffered), semester.index) : true;
              const url = c?.catalogUrl && /^https?:\/\//i.test(c.catalogUrl) ? c.catalogUrl : null;
              return (
                <li key={pc.id} className="flex items-baseline gap-3 py-1.5">
                  <span className="w-24 shrink-0 font-semibold">{c ? courseCode(c) : "…"}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-text-secondary">{c?.title ?? "Loading…"}</span>
                    {!offered && <span className="block text-micro text-warning">Hasn&apos;t historically run in this season. Check Class Search.</span>}
                    {pc.lock === "locked" && <span className="block text-micro text-text-tertiary">Marked as already taken</span>}
                  </span>
                  <span className="shrink-0 text-micro text-text-tertiary">{c ? `${formatCredits(c.credits)} cr` : ""}</span>
                  {url && (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-micro text-accent underline" aria-label={`${c ? courseCode(c) : "Course"} in the UMN catalog`}>
                      Catalog ↗
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {slots.length > 0 && (
          <p className="text-micro text-text-secondary">
            Still to choose: {slots.map((s) => `${s.label} (${s.credits} cr)`).join(", ")}.
          </p>
        )}
        <p className="text-micro text-text-secondary">
          Total: {formatCredits({ min: credits.min + placeholderCredits(semester), max: credits.max + placeholderCredits(semester) })} credits
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" disabled={codes.length === 0} onClick={copy} className="rounded-full border border-border px-3 py-1.5 hover:border-accent disabled:opacity-50" aria-live="polite">
            {copied ? "Copied ✓" : "Copy course codes"}
          </button>
          <a href={SCHEDULE_BUILDER} target="_blank" rel="noopener noreferrer" className="rounded-full bg-accent px-3 py-1.5 font-medium text-surface hover:bg-accent-hover">
            Open Schedule Builder ↗
          </a>
        </div>
      </div>
    </Modal>
  );
}
