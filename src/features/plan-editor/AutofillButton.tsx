"use client";

import { useEffect, useState } from "react";
import { pickCourses, placeCourses, type AutofillCourse } from "@/domain/autofill";
import { courseCode, type CourseId } from "@/domain/course";
import { plannedCourseIds, type Plan } from "@/domain/plan";
import { compareTerms, termLabel } from "@/domain/terms";
import { cn } from "@/components/ui/cn";
import { Modal } from "@/components/ui/Modal";
import { fetchCourses, useCourseCache } from "@/features/catalog/courseCache";
import { useAudit } from "@/features/requirements/useAudit";
import { useDisplaySettings } from "./displaySettings";
import { planActions } from "./store";

const CAPS = [12, 15, 18];

/**
 * B24: suggest courses for the remaining semesters from the plan's unmet requirements. Written by
 * Hadi's Claude. Nothing changes until the student ticks what they want and presses "Add".
 */
function AutofillReview({ plan, onDone }: { plan: Plan; onDone: () => void }) {
  const { results } = useAudit(plan);
  const hidden = useDisplaySettings((s) => s.hiddenSeasons);
  const courses = useCourseCache((s) => s.courses);
  const summaries = useCourseCache((s) => s.summaries);
  const missing = useCourseCache((s) => s.missing);
  const [cap, setCap] = useState(15);
  const [useSummer, setUseSummer] = useState(false);
  const [holdUpper, setHoldUpper] = useState(true);
  const [skip, setSkip] = useState<Set<string>>(new Set());

  const planned = new Set(plannedCourseIds(plan));
  const credits = (id: CourseId) => (courses[id] ?? summaries[id])?.credits.min;
  const { picks, skipped } = pickCourses(results, planned, credits);
  const pickKey = picks.map((p) => p.courseId).join(",");
  useEffect(() => {
    if (pickKey) void fetchCourses(pickKey.split(",").map(Number));
  }, [pickKey]);
  const loading = picks.some((p) => !courses[p.courseId] && !missing[p.courseId]);

  const course = (id: CourseId): AutofillCourse | undefined => {
    const c = courses[id];
    return c && { id, code: courseCode(c), dept: c.dept, credits: c.credits.min, termsOffered: c.termsOffered, prereqText: c.prereqText };
  };
  const { placements, unplaced } = loading ? { placements: [], unplaced: [] } : placeCourses({ plan, picks, course, hiddenSeasons: hidden, maxCredits: cap, useSummer, holdUpperDivision: holdUpper });
  const key = (p: { courseId: CourseId; term: string }) => `${p.term}:${p.courseId}`;
  const chosen = placements.filter((p) => !skip.has(key(p)));
  const terms = [...new Set(placements.map((p) => p.term))].sort(compareTerms);
  const name = (id: CourseId) => {
    const c = courses[id] ?? summaries[id];
    return c ? `${courseCode(c)} · ${c.title}` : `Course ${id}`;
  };

  if (results.length === 0) return <p className="text-text-secondary">Add a major or minor first. Autofill works from its requirements.</p>;
  if (loading) return <p role="status">Looking up {picks.length} courses…</p>;

  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-2 text-micro text-text-secondary">
        At most
        <select value={cap} onChange={(e) => setCap(Number(e.target.value))} className="rounded-row border border-border bg-surface px-1.5 py-0.5">
          {CAPS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        credits per semester
      </label>
      <label className="-mt-2 flex items-center gap-2 text-micro text-text-secondary">
        <input type="checkbox" checked={useSummer} onChange={(e) => setUseSummer(e.target.checked)} className="accent-accent" />
        Use summer terms
      </label>
      <label className="-mt-2 flex items-center gap-2 text-micro text-text-secondary">
        <input type="checkbox" checked={holdUpper} onChange={(e) => setHoldUpper(e.target.checked)} className="accent-accent" />
        Keep 3xxx+ courses out of the first year (many list upper-division standing, which planu.mn can&apos;t check)
      </label>

      {placements.length === 0 && <p className="text-text-secondary">Nothing to add: every requirement autofill can work with is already planned.</p>}
      {terms.map((t) => (
        <section key={t} aria-label={termLabel(t)}>
          <h3 className="mb-1 text-micro font-semibold tracking-wide text-text-secondary uppercase">{termLabel(t)}</h3>
          <ul className="flex flex-col gap-1">
            {placements
              .filter((p) => p.term === t)
              .map((p) => (
                <li key={key(p)}>
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1 accent-accent"
                      checked={!skip.has(key(p))}
                      onChange={(e) =>
                        setSkip((s) => {
                          const next = new Set(s);
                          if (e.target.checked) next.delete(key(p));
                          else next.add(key(p));
                          return next;
                        })
                      }
                    />
                    <span className="min-w-0">
                      <span className="block truncate">{name(p.courseId)}</span>
                      <span className="block text-micro text-text-tertiary">
                        For {p.reasons.join(", ")}
                        {p.note && <span className="text-warning"> · {p.note}</span>}
                        {p.heldUpperDivision && <span> · Held to year two: upper-division</span>}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
          </ul>
        </section>
      ))}

      {(unplaced.length > 0 || skipped.length > 0) && (
        <section aria-label="Not placed" className="rounded-row bg-sunken p-3 text-micro text-text-secondary">
          <h3 className="mb-1 font-semibold">Couldn&apos;t place</h3>
          <ul className="flex flex-col gap-0.5">
            {unplaced.map((u) => (
              <li key={u.courseId}>
                {name(u.courseId)}: {u.why.toLowerCase()}
              </li>
            ))}
            {skipped.map((s) => (
              <li key={s}>{s}: needs a choice autofill can&apos;t make (see the rail)</li>
            ))}
          </ul>
        </section>
      )}

      <details className="text-micro text-text-tertiary">
        <summary className="cursor-pointer">How these are chosen (rules of thumb, not an audit)</summary>
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          <li>Courses come from what your programs list for requirements you haven&apos;t met; a course that counts twice is preferred. &ldquo;Choose one of&rdquo; groups take the first option that works.</li>
          <li>Requirements that count 0 toward progress (e.g. optional elective credits) are left out.</li>
          <li>Terms: only after the current one, at most the credit limit above, no leave semesters, summers only if ticked.</li>
          <li>Seasons come from past grade records through Fall 2024 (3+ terms needed); a course may run differently now.</li>
          <li>Prerequisites are read from catalog text, which can be incomplete. Ones in your plan are placed first; ones outside it don&apos;t block and are noted.</li>
          <li>Placement is greedy: the earliest term that fits, so later terms may come out lighter.</li>
        </ul>
        <p className="mt-1">It&apos;s a starting point: check it with your advisor and APAS.</p>
      </details>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className="rounded-full border border-border px-3 py-1.5 hover:border-accent">
          Cancel
        </button>
        <button
          type="button"
          disabled={chosen.length === 0}
          onClick={() => {
            for (const p of chosen) planActions.addCourse(p.term, p.courseId);
            onDone();
          }}
          className={cn("rounded-full bg-accent px-3 py-1.5 font-medium text-surface hover:bg-accent-hover", chosen.length === 0 && "opacity-50")}
        >
          Add {chosen.length} {chosen.length === 1 ? "course" : "courses"}
        </button>
      </div>
    </div>
  );
}

export function AutofillButton({ plan }: { plan: Plan }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="rounded-row border border-border px-2 py-1 text-micro hover:border-accent hover:text-accent">
        Autofill
      </button>
      <Modal open={open} onOpenChange={setOpen} title="Autofill remaining semesters" description="Suggested courses for your unmet requirements. Untick anything you don't want; nothing changes until you add.">
        {open && <AutofillReview plan={plan} onDone={() => setOpen(false)} />}
      </Modal>
    </>
  );
}
