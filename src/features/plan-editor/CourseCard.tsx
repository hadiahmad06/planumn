"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { courseCode, formatCredits, type CourseSummary } from "@/domain/course";
import type { PlannedCourse } from "@/domain/plan";
import type { TermCode } from "@/domain/terms";
import { cn } from "@/components/ui/cn";
import { AlertIcon, CloseIcon, LockIcon } from "@/components/ui/icons";
import type { PrereqCheck } from "@/domain/prereqs";
import { useCourseInfo } from "@/features/catalog/courseCache";
import { usePreviewStore } from "@/features/preview/store";
import { stripeColor } from "./courseColor";
import { plannedId, type DragData } from "./dnd";
import { useDisplaySettings } from "./displaySettings";
import { planActions } from "./store";

/** Card height grows with credits so a semester's load is visible at a glance (2026 redesign). */
export function cardHeight(course: CourseSummary | undefined) {
  return Math.max(44, (course?.credits.max ?? 3) * 12 + 8);
}

function prereqMessage(p: PrereqCheck) {
  return `Prerequisites not planned in an earlier semester: ${p.missing}${p.hasOtherPaths ? " (or instructor consent / other ways to qualify)" : ""}`;
}

export function CourseCardFace({ course, lock, dragging, prereq }: { course: CourseSummary | undefined; lock?: PlannedCourse["lock"]; dragging?: boolean; prereq?: PrereqCheck }) {
  const colorKey = useDisplaySettings((s) => s.colorKey);
  return (
    <div
      className={cn(
        "relative flex overflow-hidden rounded-card border border-border bg-surface text-left shadow-card",
        dragging && "shadow-overlay ring-2 ring-accent/30",
      )}
      style={{ height: cardHeight(course) }}
    >
      <span className="w-1 shrink-0" style={{ background: stripeColor(course, colorKey) }} />
      <div className="flex min-w-0 flex-1 flex-col justify-center px-2.5 py-1">
        <div className="flex items-center gap-1.5">
          <span className="shrink-0 font-semibold whitespace-nowrap">{course ? courseCode(course) : "…"}</span>
          {lock === "locked" && <LockIcon className="shrink-0 text-text-tertiary" size={12} aria-label="Locked" />}
          {prereq && !prereq.met && (
            <span title={prereqMessage(prereq)} className={cn("shrink-0", prereq.hasOtherPaths ? "text-text-tertiary" : "text-warning")}>
              <AlertIcon size={12} aria-hidden />
              <span className="sr-only">{prereqMessage(prereq)}</span>
            </span>
          )}
          <span className="ml-auto min-w-0 truncate text-micro text-text-secondary">{course ? `${formatCredits(course.credits)} cr` : ""}</span>
        </div>
        {course && cardHeight(course) >= 52 && <span className="truncate text-micro text-text-secondary">{course.title}</span>}
      </div>
    </div>
  );
}

export function CourseCard({ term, index, planned, prereq }: { term: TermCode; index: number; planned: PlannedCourse; prereq?: PrereqCheck }) {
  const course = useCourseInfo(planned.id);
  const openPreview = usePreviewStore((s) => s.openPreview);
  const hoverPreview = usePreviewStore((s) => s.hoverPreview);
  const locked = planned.lock === "locked";
  const data: DragData = { type: "planned", term, index, courseId: planned.id };
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: plannedId(term, planned.id),
    data,
    disabled: locked,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("group relative list-none", isDragging && "opacity-40")}
      onMouseEnter={() => hoverPreview(planned.id)}
      onMouseLeave={() => hoverPreview(null)}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        onClick={() => openPreview(planned.id)}
        onKeyDown={(e) => {
          listeners?.onKeyDown?.(e);
          if ((e.key === "Delete" || e.key === "Backspace") && !locked) planActions.removeCourse(term, planned.id);
        }}
        aria-label={course ? `${courseCode(course)}, ${course.title}` : "Course"}
        className={cn("block w-full rounded-card focus-visible:outline-2 focus-visible:outline-accent", locked ? "cursor-pointer" : "cursor-grab")}
      >
        <CourseCardFace course={course} lock={planned.lock} prereq={prereq} />
      </button>
      {!locked && (
        <button
          type="button"
          onClick={() => planActions.removeCourse(term, planned.id)}
          aria-label="Remove course"
          className="absolute -top-1.5 -right-1.5 hidden rounded-full border border-border bg-surface p-0.5 text-text-secondary shadow-card group-hover:block hover:text-danger"
        >
          <CloseIcon size={12} />
        </button>
      )}
    </li>
  );
}
