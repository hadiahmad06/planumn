"use client";
import { useEffect, useState } from "react";
import { termLabel } from "@/domain/terms";
import { instructorGradeSummary, type InstructorInsight } from "./instructor";

const cache = new Map<number, Promise<InstructorInsight[]>>();
function load(id: number, retry: boolean) {
  if (retry) cache.delete(id);
  let request = cache.get(id);
  if (!request) {
    request = fetch(`/api/courses/${id}/instructors`)
      .then(async (response) => {
        if (!response.ok)
          throw new Error("Instructor history could not be loaded.");
        return (await response.json()) as InstructorInsight[];
      })
      .catch((error) => {
        if (cache.get(id) === request) cache.delete(id);
        throw error;
      });
    if (cache.size >= 100) cache.delete(cache.keys().next().value!);
    cache.set(id, request);
  }
  return request;
}
/** Written by Michael's Codex. Alphabetical historical comparisons, with visible sample sizes and caveats. */
export function InstructorInsights({ courseId }: { courseId: number }) {
  const [state, setState] = useState<{
    id: number;
    data?: InstructorInsight[];
    error?: string;
  }>({ id: courseId });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    load(courseId, attempt > 0).then(
      (data) => {
        if (active) setState({ id: courseId, data });
      },
      () => {
        if (active)
          setState({
            id: courseId,
            error: "Instructor history could not be loaded.",
          });
      },
    );
    return () => {
      active = false;
    };
  }, [courseId, attempt]);
  const current = state.id === courseId ? state : { id: courseId };
  return (
    <section aria-label="Historical grades by instructor">
      <h4 className="font-semibold">Grades by instructor</h4>
      <p className="mt-1 text-xs text-text-secondary">
        Historical records through Fall 2024. Students, sections and terms
        differ; these figures do not measure teaching quality or guarantee
        future results.
      </p>
      {current.error ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {current.error}{" "}
          <button
            type="button"
            className="underline"
            onClick={() => {
              setState({ id: courseId });
              setAttempt((n) => n + 1);
            }}
          >
            Retry
          </button>
        </p>
      ) : !current.data ? (
        <p role="status" className="mt-3 text-sm text-text-secondary">
          Loading instructor history…
        </p>
      ) : !current.data.length ? (
        <p className="mt-3 text-sm text-text-secondary">
          No named instructor history is available for this course.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {current.data.map((instructor) => {
            const summary = instructorGradeSummary(instructor.grades);
            const terms = instructor.terms;
            return (
              <details
                key={instructor.id}
                className="rounded-row border border-border p-3 text-sm"
              >
                <summary className="cursor-pointer">
                  <span className="font-medium">{instructor.name}</span>
                  <span className="mt-1 block text-xs text-text-secondary">
                    {summary.total.toLocaleString()} recorded grades ·{" "}
                    {summary.gpa === null
                      ? "Fewer than 20 letter grades"
                      : `Letter-grade GPA ${summary.gpa.toFixed(2)}`}
                  </span>
                </summary>
                <p className="my-3 text-xs text-text-secondary">
                  {terms.length} recorded{" "}
                  {terms.length === 1 ? "term" : "terms"}
                  {terms.length ? `: ${terms.map(termLabel).join(", ")}` : ""}.
                  GPA uses letter grades only; S/N/P/W are excluded. At least 20
                  letter grades are needed to display an average.
                </p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {Object.entries(instructor.grades)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([grade, count]) => (
                      <div key={grade} className="flex justify-between gap-3">
                        <dt>{grade}</dt>
                        <dd className="tabular-nums">
                          {count.toLocaleString()} (
                          {summary.total
                            ? ((count / summary.total) * 100).toFixed(1)
                            : "0.0"}
                          %)
                        </dd>
                      </div>
                    ))}
                </dl>
              </details>
            );
          })}
        </div>
      )}
    </section>
  );
}
