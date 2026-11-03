"use client";

import { useState } from "react";
import { courseCode, type CourseId } from "@/domain/course";
import type { Plan } from "@/domain/plan";
import { termLabel } from "@/domain/terms";
import { prerequisiteGraph, type UnlockCourse } from "@/domain/unlocks";
import { cn } from "@/components/ui/cn";
import { useCourseCache } from "@/features/catalog/courseCache";

/**
 * Prerequisite chain (B22). Written by Ishaan's Claude; "or" wording by Hadi's Claude. Shows the plan's
 * longest chain of required prerequisites and which later courses each course unlocks. A course that is
 * only one of several planned options ("A or B") is never called required, and isn't on the chain.
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
  const hasAlternatives = keys.some(([, later]) => later.some((u) => !u.required));

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
            Inferred from catalog prerequisite text, so it can miss or misread a requirement. The chain only follows prerequisites your
            plan has no other planned way to meet: moving one of them later pushes the next course back unless you add an alternative.
          </p>
          {criticalPath.length === 0 ? (
            <p className="text-text-tertiary">No planned course needs one specific planned course yet.</p>
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
              {keys.slice(0, 6).map(([id, later]) => {
                const required = later.filter((u) => u.required).map((u) => code(u.id));
                const optional = later.filter((u) => !u.required).map((u) => code(u.id));
                return (
                  <li key={id}>
                    <span className="font-medium text-text-primary">{code(id)}</span>
                    {required.length > 0 && <> unlocks {required.join(", ")}</>}
                    {required.length > 0 && optional.length > 0 && ";"}
                    {optional.length > 0 && <> is one option for {optional.join(", ")}</>}
                  </li>
                );
              })}
            </ul>
          )}
          {hasAlternatives && (
            <p className="text-micro text-text-tertiary">
              &ldquo;One option&rdquo;: the prerequisite says &ldquo;or&rdquo; and another course earlier in your plan also meets it, so this
              course alone doesn&apos;t hold the later one back.
            </p>
          )}
        </>
      )}
    </section>
  );
}
