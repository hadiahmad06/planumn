"use client";

import { useState } from "react";
import { doubleDipCandidates, findDoubleDips, type DipTarget } from "@/domain/doubleDip";
import { libEdCoverage } from "@/domain/libed";
import { plannedCourseIds, type Plan } from "@/domain/plan";
import type { ProgramResult } from "@/domain/requirements";
import { cn } from "@/components/ui/cn";
import { useCourseCache } from "@/features/catalog/courseCache";
import { useLibEd } from "@/features/libed/useLibEd";
import { OptionChip } from "./RequirementItem";

const SHOWN = 8;

function TargetChip({ target, showProgram }: { target: DipTarget; showProgram: boolean }) {
  const text = target.kind === "libed" ? `Lib Ed: ${target.label}` : showProgram ? `${target.programName}: ${target.name}` : target.name;
  return (
    <span
      title={text}
      className={cn(
        "max-w-full truncate rounded-full px-2 py-px text-[10px] leading-4",
        target.kind === "libed" ? "bg-sunken text-text-secondary" : "bg-accent-soft text-accent",
      )}
    >
      {text}
    </span>
  );
}

/**
 * B12 double-dip finder: unplanned courses that count toward two or more unfinished requirements or
 * uncovered Lib Ed designations at once. Drag a course into a semester, or click it for its preview.
 */
export function DoubleDipFinder({ plan, results }: { plan: Plan; results: ProgramResult[] }) {
  const [open, setOpen] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const plannedIds = plannedCourseIds(plan);
  const planned = new Set(plannedIds);
  const candidates = doubleDipCandidates(results, planned);
  const { codes, error, retry } = useLibEd([...plannedIds, ...candidates]);
  const summaries = useCourseCache((s) => s.summaries);
  const courses = useCourseCache((s) => s.courses);

  const covered = new Set(libEdCoverage(plan, codes).coverage.filter((c) => c.courses.length > 0).map((c) => c.designation.code));
  const { dips, pending } = findDoubleDips({ results, planned, libEd: codes, coveredLibEd: covered });

  if (results.length === 0) return null;
  const showProgram = results.length > 1;
  const visible = showAll ? dips : dips.slice(0, SHOWN);

  return (
    <section className="flex flex-col gap-2 border-t border-border pt-4" aria-label="Double-dip finder">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex items-baseline gap-2 text-left">
        <h3 className="min-w-0 flex-1 font-semibold">Double-dip finder</h3>
        <span className="shrink-0 text-micro text-text-secondary">{dips.length} found</span>
        <span aria-hidden className={cn("text-micro text-text-tertiary transition-transform", open && "rotate-90")}>▶</span>
      </button>
      {open && (
        <>
          <p className="text-micro text-text-tertiary">
            Courses not in your plan yet that count toward two or more things you haven&apos;t finished: requirements of
            your programs, or Lib Ed designations none of your courses have. Check with your advisor that a course may
            count twice.
          </p>
          {error && (
            <p className="text-micro text-danger">
              {error}{" "}
              <button type="button" onClick={retry} className="underline">
                Retry
              </button>
            </p>
          )}
          {pending > 0 && !error && <p className="text-micro text-text-tertiary">Checking Lib Ed for {pending} course{pending === 1 ? "" : "s"}…</p>}
          {dips.length === 0 && pending === 0 && !error && <p className="text-text-tertiary">No double-dips left for your unfinished requirements.</p>}
          <ul className="flex flex-col gap-2">
            {visible.map((d) => {
              const c = courses[d.courseId] ?? summaries[d.courseId];
              const option = {
                groupId: String(d.courseId),
                courseId: d.courseId,
                code: c ? `${c.dept} ${c.number}` : null,
                title: c?.title ?? null,
                credits: null,
              };
              return (
                <li key={d.courseId} className="flex flex-col gap-1">
                  <OptionChip option={option} primary />
                  <div className="flex flex-wrap gap-1">
                    {d.targets.map((t) => (
                      <TargetChip key={t.kind === "libed" ? t.code : `${t.programId}/${t.requirementId}`} target={t} showProgram={showProgram} />
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
          {dips.length > SHOWN && (
            <button type="button" onClick={() => setShowAll(!showAll)} className="self-start text-micro text-text-secondary underline hover:text-accent">
              {showAll ? "Show fewer" : `Show all ${dips.length}`}
            </button>
          )}
        </>
      )}
    </section>
  );
}
