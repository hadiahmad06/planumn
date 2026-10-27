"use client";

import { semesterWorkload, type WorkloadLevel } from "@/domain/workload";
import type { Semester } from "@/domain/plan";
import { cn } from "@/components/ui/cn";
import { useCourseCache } from "@/features/catalog/courseCache";

const STYLE: Record<WorkloadLevel, string> = {
  light: "bg-success-soft text-success",
  moderate: "bg-sunken text-text-secondary",
  heavy: "bg-warning-soft text-warning",
};

/** Small light / moderate / heavy pill on a semester header (B7). */
export function WorkloadBadge({ semester }: { semester: Semester }) {
  const courses = useCourseCache((s) => s.courses);
  const loaded = semester.courses.map((c) => courses[c.id]).filter(Boolean);
  if (loaded.length === 0) return null;
  const w = semesterWorkload(loaded.map((c) => ({ credits: c.credits.min, grades: c.grades })));
  const title = `${w.level[0].toUpperCase()}${w.level.slice(1)} semester: ${w.credits} credits${
    w.gpa !== null ? `, average historical GPA ${w.gpa.toFixed(2)}` : ""
  }. A rough signal from past grades (through Fall 2024), not a measure of effort.`;
  return (
    <span title={title} className={cn("rounded-full px-1.5 py-px text-[10px] font-medium", STYLE[w.level])}>
      {w.level}
      <span className="sr-only">. {title}</span>
    </span>
  );
}
