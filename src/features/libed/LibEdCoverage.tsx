"use client";

import { useState } from "react";
import { courseCode } from "@/domain/course";
import { libEdCoverage, type LibEdCoverage as Coverage, type LibEdGroup } from "@/domain/libed";
import { plannedCourseIds, type Plan } from "@/domain/plan";
import { termLabel } from "@/domain/terms";
import { cn } from "@/components/ui/cn";
import { useCourseCache } from "@/features/catalog/courseCache";
import { useLibEd } from "./useLibEd";

const GROUPS: { group: LibEdGroup; title: string }[] = [
  { group: "core", title: "Diversified core" },
  { group: "theme", title: "Designated themes" },
  { group: "writing", title: "Writing" },
];

const ONE_STOP = "https://onestop.umn.edu/academics/undergraduate/lib-ed-requirements-overview/liberal-education-requirements";

function Row({ item }: { item: Coverage }) {
  const courses = useCourseCache((s) => s.courses);
  const has = item.courses.length > 0;
  return (
    <li className="flex gap-2">
      <span
        aria-hidden
        className={cn("mt-1.5 size-2 shrink-0 rounded-full", has ? "bg-success" : "border border-border-strong")}
      />
      <div className="min-w-0 flex-1">
        <p className={cn(has ? "text-text-primary" : "text-text-secondary")}>
          {item.designation.label}
          <span className="sr-only">{has ? ": in plan" : ": not in plan yet"}</span>
        </p>
        {has && (
          <p className="text-micro text-text-secondary">
            {item.courses
              .map((c) => {
                if (c.kind === "slot") return `${c.label}: slot (${termLabel(c.term)})`;
                const course = courses[c.courseId];
                return `${course ? courseCode(course) : "…"} (${termLabel(c.term)})`;
              })
              .join(" · ")}
          </p>
        )}
      </div>
    </li>
  );
}

/**
 * Twin Cities Lib Ed designation coverage for the plan (B3). Written by Ishaan's Claude.
 * Shows which planned courses carry each designation. It doesn't judge completion: theme counts, credit
 * minimums and the upper-division WI rule depend on the admit term and are APAS's call.
 */
export function LibEdCoverage({ plan }: { plan: Plan }) {
  const [open, setOpen] = useState(true);
  const { codes, error, retry } = useLibEd(plannedCourseIds(plan));
  const result = libEdCoverage(plan, codes);
  const covered = result.coverage.filter((c) => c.courses.length > 0).length;

  return (
    <section className="flex flex-col gap-2 border-t border-border pt-4" aria-label="Liberal Education coverage">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex items-baseline gap-2 text-left">
        <h3 className="min-w-0 flex-1 font-semibold">Liberal Education (Twin Cities)</h3>
        <span className="shrink-0 text-micro text-text-secondary">
          {covered}/{result.coverage.length} in plan
        </span>
        <span aria-hidden className={cn("text-micro text-text-tertiary transition-transform", open && "rotate-90")}>▶</span>
      </button>
      {open && (
        <>
          <p className="text-micro text-text-tertiary">
            Designations of your planned courses in the current UMN catalog. This isn&apos;t an audit: how many themes
            and Writing Intensive courses you need depends on your admit term. APAS is the official record (
            <a href={ONE_STOP} target="_blank" rel="noopener noreferrer" className="underline">
              rules on One Stop
            </a>
            ).
          </p>
          {error && (
            <p className="text-micro text-danger">
              {error}{" "}
              <button type="button" onClick={retry} className="underline">
                Retry
              </button>
            </p>
          )}
          {result.pending > 0 && !error && <p className="text-micro text-text-tertiary">Looking up {result.pending} course{result.pending === 1 ? "" : "s"}…</p>}
          {result.unknown > 0 && (
            <p className="text-micro text-text-tertiary">
              {result.unknown} planned course{result.unknown === 1 ? " isn't" : "s aren't"} in the current UMN catalog, so
              {result.unknown === 1 ? " its" : " their"} designations are unknown.
            </p>
          )}
          {GROUPS.map(({ group, title }) => (
            <div key={group} className="flex flex-col gap-1">
              <h4 className="text-micro font-semibold tracking-wide text-text-secondary uppercase">{title}</h4>
              <ul className="flex flex-col gap-1">
                {result.coverage
                  .filter((c) => c.designation.group === group)
                  .map((c) => (
                    <Row key={c.designation.code} item={c} />
                  ))}
              </ul>
            </div>
          ))}
        </>
      )}
    </section>
  );
}
