"use client";

import { useState } from "react";
import { courseCode, type CourseId } from "@/domain/course";
import type { Plan } from "@/domain/plan";
import { termLabel } from "@/domain/terms";
import { prerequisiteGraph, type UnlockCourse } from "@/domain/unlocks";
import { cn } from "@/components/ui/cn";
import { useCourseCache } from "@/features/catalog/courseCache";

/**
 * Prerequisite chain (B22). Written by Ishaan's Claude. Shows the plan's longest prerequisite chain
 * (delaying any course on it pushes the rest back) and which later courses each course unlocks.
 */
export function PrereqChain({ plan }: { plan: Plan }) {
  const [open, setOpen] = useState(true);
  const courses = useCourseCache((s) => s.courses);
  const details: Record<CourseId, UnlockCourse> = {};
  for (const [id, c] of Object.entries(courses)) details[Number(id)] = { id: c.id, code: courseCode(c), dept: c.dept, prereqText: c.prereqText };
  const { unlocks, criticalPath } = prerequisiteGraph(plan, details);
  const termOf = new Map<CourseId, string>();
  for (const s of plan.semesters) for (const c of s.courses) if (!termOf.has(c.id)) termOf.set(c.id, s.index);
  const code = (id: CourseId) => details[id]?.code ?? String(id);
  const keys = [...unlocks.entries()].filter(([, later]) => later.length > 0).sort((a, b) => b[1].length - a[1].length);

  return (
    <section className="flex flex-col gap-2 border-t border-border pt-4" aria-label="Prerequisite chain">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex items-baseline gap-2 text-left">
        <h3 className="min-w-0 flex-1 font-semibold">Prerequisite chain</h3>
        {criticalPath.length > 0 && <span className="shrink-0 text-micro text-text-secondary">{criticalPath.length} courses long</span>}
        <span aria-hidden className={cn("text-micro text-text-tertiary transition-transform", open && "rotate-90")}>▶</span>
      </button>
      {open && (
        <>
          <p className="text-micro text-text-tertiary">
            From catalog prerequisite text. Delaying a course on the longest chain pushes every course after it back.
          </p>
          {criticalPath.length === 0 ? (
            <p className="text-text-tertiary">No planned course needs another planned course yet.</p>
          ) : (
            <ol className="flex flex-col gap-0.5 text-micro">
              {criticalPath.map((id, i) => (
                <li key={id}>
                  {i > 0 && <span aria-hidden className="text-text-tertiary">↓ </span>}
                  <span className="font-medium text-text-primary">{code(id)}</span>
                  <span className="text-text-secondary"> · {termLabel(termOf.get(id)!)}</span>
                </li>
              ))}
            </ol>
          )}
          {keys.length > 0 && (
            <ul className="flex flex-col gap-0.5 text-micro text-text-secondary">
              {keys.slice(0, 6).map(([id, later]) => (
                <li key={id}>
                  <span className="font-medium text-text-primary">{code(id)}</span> unlocks {later.map(code).join(", ")}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
