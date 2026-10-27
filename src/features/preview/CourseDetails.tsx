import type { CourseDetails as Details } from "@/domain/course";
import { courseCode, formatCredits } from "@/domain/course";
import { termLabel } from "@/domain/terms";

import { InstructorInsights } from "./InstructorInsights";

const gradeOrder = [
  "A",
  "A-",
  "B+",
  "B",
  "B-",
  "C+",
  "C",
  "C-",
  "D+",
  "D",
  "F",
  "S",
  "N",
  "P",
  "W",
];

/** Written by Michael's Codex. Visible percentages are also the chart's text equivalent. */
export function CourseDetails({ course }: { course: Details }) {
  const grades = Object.entries(course.grades)
    .filter(([, n]) => Number.isFinite(n) && n > 0)
    .sort(
      ([a], [b]) =>
        (gradeOrder.indexOf(a) < 0 ? 99 : gradeOrder.indexOf(a)) -
        (gradeOrder.indexOf(b) < 0 ? 99 : gradeOrder.indexOf(b)),
    );
  const total = grades.reduce((sum, [, n]) => sum + n, 0);
  return (
    <div className="space-y-5 p-5">
      <div>
        <p className="font-semibold text-accent">{courseCode(course)}</p>
        <h3 className="mt-1 text-xl font-semibold">{course.title}</h3>
        <p className="mt-2 text-text-secondary">
          {formatCredits(course.credits)} credits
        </p>
      </div>
      <p className="leading-relaxed">
        {course.description || "A course description is not available."}
      </p>
      {course.libEds.length > 0 && (
        <ul
          className="flex flex-wrap gap-2"
          aria-label="Liberal education designations"
        >
          {course.libEds.map((tag) => (
            <li
              key={tag}
              className="rounded-row bg-accent-soft px-2 py-1 text-xs text-accent"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}
      <section aria-label="Grade distribution">
        <h4 className="font-semibold">Grade distribution</h4>
        {total > 0 ? (
          <>
            <p className="mb-3 text-xs text-text-secondary">
              {total.toLocaleString()} recorded grades · historical data through
              Fall 2024
            </p>
            <dl className="space-y-1.5">
              {grades.map(([grade, count]) => {
                const percent = (count / total) * 100;
                return (
                  <div
                    key={grade}
                    className="grid grid-cols-[2rem_1fr_3rem] items-center gap-2 text-xs"
                  >
                    <dt>{grade}</dt>
                    <dd
                      className="h-3 overflow-hidden rounded-row bg-sunken"
                      aria-hidden="true"
                    >
                      <div
                        className="h-full bg-accent"
                        style={{ width: `${percent}%` }}
                      />
                    </dd>
                    <dd
                      title={`${count.toLocaleString()} grades`}
                      className="text-right tabular-nums"
                    >
                      {percent.toFixed(1)}%
                    </dd>
                  </div>
                );
              })}
            </dl>
          </>
        ) : (
          <p className="mt-2 text-text-secondary">No grade data available.</p>
        )}
      </section>
      <InstructorInsights courseId={course.id} />
      <section>
        <h4 className="font-semibold">Terms recorded</h4>
        <p className="mt-1 text-xs text-text-secondary">
          Past offerings are a guide, not a guarantee of future availability.
        </p>
        <p className="mt-2 text-sm">
          {course.termsOffered.length
            ? course.termsOffered
                .map((term) => {
                  try {
                    return termLabel(term);
                  } catch {
                    return term;
                  }
                })
                .join(", ")
            : "No offering history available."}
        </p>
      </section>
      {course.catalogUrl && /^https?:\/\//i.test(course.catalogUrl) && (
        <a
          href={course.catalogUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block font-medium text-accent underline"
        >
          Open in the catalog
        </a>
      )}
    </div>
  );
}
