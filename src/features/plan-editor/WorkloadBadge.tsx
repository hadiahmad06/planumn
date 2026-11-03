"use client";

import { semesterWorkloadStatus, type WorkloadLevel } from "@/domain/workload";
import type { Semester } from "@/domain/plan";
import { cn } from "@/components/ui/cn";
import { useCourseCache } from "@/features/catalog/courseCache";

const STYLE: Record<WorkloadLevel, string> = {
  light: "bg-success-soft text-success",
  moderate: "bg-sunken text-text-secondary",
  heavy: "bg-warning-soft text-warning",
};

const PILL = "rounded-full px-1.5 py-px text-[10px] font-medium";

/**
 * Small light / moderate / heavy pill on a semester header (B7). Rated only once every course in the
 * semester has catalog details; nothing while loading, "no rating" when a course isn't in the catalog.
 */
export function WorkloadBadge({ semester }: { semester: Semester }) {
  const courses = useCourseCache((s) => s.courses);
  const missing = useCourseCache((s) => s.missing);
  const result = semesterWorkloadStatus(
    semester.courses.map((c) => c.id),
    courses,
    missing,
    (semester.placeholders ?? []).map((p) => p.credits),
  );
  if (result.status === "empty" || result.status === "loading") return null;

  if (result.status === "incomplete") {
    const title = `No workload rating: ${result.unavailable} course${result.unavailable === 1 ? " isn't" : "s aren't"} in the catalog (data through Fall 2024).`;
    return (
      <span title={title} className={cn(PILL, "bg-sunken text-text-tertiary")}>
        no rating
        <span className="sr-only">. {title}</span>
      </span>
    );
  }

  const w = result.workload;
  const title = `${w.level[0].toUpperCase()}${w.level.slice(1)} semester: ${w.credits} credits${
    w.gpa !== null ? `, average historical GPA ${w.gpa.toFixed(2)}` : ""
  }. A rough signal from past grades (through Fall 2024), not a measure of effort. How: each course weighs its credits × (1 + how far its average GPA is below 3.3, ÷ 1.3); the total is heavy at 20+, light at 13 or less.`;
  return (
    <span title={title} className={cn(PILL, STYLE[w.level])}>
      {w.level}
      <span className="sr-only">. {title}</span>
    </span>
  );
}
