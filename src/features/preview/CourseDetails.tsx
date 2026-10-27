"use client";

import { useId, useState } from "react";
import type { CourseDetails as Details } from "@/domain/course";
import { courseCode, formatCredits } from "@/domain/course";
import { offeringHistory, offeringNote } from "@/domain/health";
import { TWIN_CITIES_LIBED } from "@/domain/libed";
import { termLabel } from "@/domain/terms";
import { cn } from "@/components/ui/cn";
import { LockIcon } from "@/components/ui/icons";
import { useLibEd } from "@/features/libed/useLibEd";
import { planActions, usePlanStore } from "@/features/plan-editor/store";
import { LetterGradeChart, OtherGradeChart } from "./GradeCharts";
import { InstructorInsights } from "./InstructorInsights";

/**
 * Course preview card, redesigned by Hadi's Claude after the 2025 card (Hadi, 2026-10-27). First
 * version by Michael's Codex. Heading, compact grade charts, a description that opens on hover and
 * stays open on click, then the v2 extras (lock, Lib Ed, offering, instructors) kept small.
 */
export function PreviewHeading({ course, className }: { course: Details; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="flex flex-wrap items-baseline gap-x-1.5 text-accent">
        <span className="text-[22px] leading-7 font-bold">{courseCode(course)}</span>
        <span className="text-label font-semibold">– {formatCredits(course.credits)} cr</span>
      </p>
      <h3 className="text-label leading-snug font-medium text-text-primary">{course.title}</h3>
    </div>
  );
}

function Description({ text, alwaysOpen }: { text: string; alwaysOpen: boolean }) {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const id = useId();
  const open = alwaysOpen || pinned || hovered;
  return (
    <section onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
      {alwaysOpen ? (
        <h4 className="text-micro font-semibold tracking-wide text-text-secondary uppercase">Description</h4>
      ) : (
        <button
          type="button"
          aria-expanded={pinned}
          aria-controls={id}
          onClick={() => setPinned(!pinned)}
          className="flex items-center gap-1.5 rounded-row text-micro font-semibold tracking-wide text-text-secondary uppercase hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
        >
          Description
          <span aria-hidden className={cn("transition-transform motion-reduce:transition-none", open && "rotate-180")}>
            ▾
          </span>
          {!pinned && <span className="font-normal tracking-normal normal-case text-text-tertiary">· click to keep open</span>}
        </button>
      )}
      <div
        id={id}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <p className={cn("overflow-hidden pt-1 leading-relaxed text-text-secondary", alwaysOpen && "line-clamp-5")}>
          {text || "No description in the catalog."}
        </p>
      </div>
    </section>
  );
}

/** Lib Ed chips (UMN catalog, as in B3) and the historical offering pattern. */
function Facts({ course }: { course: Details }) {
  const { codes } = useLibEd([course.id]);
  const libEds = TWIN_CITIES_LIBED.filter((d) => codes[course.id]?.includes(d.code));
  const offering = offeringHistory(course.termsOffered);
  const seasons = offering.known ? (["fall", "spring", "summer"] as const).filter((s) => offering.seasons.includes(s)) : [];
  return (
    <ul className="flex flex-wrap gap-1.5 text-micro" aria-label="Course facts">
      {seasons.length > 0 && (
        <li title={offeringNote(offering)} className="rounded-full border border-border px-2 py-0.5 text-text-secondary">
          Offered {seasons.map((s) => s[0].toUpperCase() + s.slice(1)).join(" · ")}
        </li>
      )}
      {libEds.map((d) => (
        <li key={d.code} className="rounded-full bg-accent-soft px-2 py-0.5 text-accent">
          {d.label}
        </li>
      ))}
    </ul>
  );
}

/** Where this course sits in the plan, with the lock toggle (B11's "lock toggle in the preview"). */
function PlanStatus({ course }: { course: Details }) {
  const plan = usePlanStore((s) => s.plan);
  const terms = (plan?.semesters ?? []).filter((s) => s.courses.some((c) => c.id === course.id));
  if (terms.length === 0) return null;
  const locked = terms.every((s) => s.courses.find((c) => c.id === course.id)?.lock === "locked");
  return (
    <div className="flex flex-wrap items-center gap-2 text-micro">
      <span className="text-text-secondary">In your plan: {terms.map((s) => termLabel(s.index)).join(", ")}</span>
      <button
        type="button"
        aria-pressed={locked}
        onClick={() => terms.forEach((s) => planActions.setLock(s.index, course.id, locked ? "unlocked" : "locked"))}
        className={cn(
          "ml-auto flex items-center gap-1 rounded-full border px-2 py-0.5 focus-visible:outline-2 focus-visible:outline-accent",
          locked ? "border-accent bg-accent-soft text-accent" : "border-border text-text-secondary hover:text-accent",
        )}
      >
        <LockIcon size={11} />
        {locked ? "Locked (taken)" : "Lock as taken"}
      </button>
    </div>
  );
}

function More({ course }: { course: Details }) {
  const url = course.catalogUrl && /^https?:\/\//i.test(course.catalogUrl) ? course.catalogUrl : null;
  const summary = "cursor-pointer rounded-row py-1 text-micro font-semibold tracking-wide text-text-secondary uppercase hover:text-accent";
  return (
    <div className="flex flex-col border-t border-border pt-1">
      {course.prereqText && (
        <details>
          <summary className={summary}>Prerequisites</summary>
          <p className="pb-2 text-micro leading-relaxed text-text-secondary">{course.prereqText}</p>
        </details>
      )}
      <details>
        <summary className={summary}>Grades by instructor</summary>
        <div className="pb-2 text-body">
          <InstructorInsights courseId={course.id} />
        </div>
      </details>
      <details>
        <summary className={summary}>Terms recorded</summary>
        <p className="pb-2 text-micro leading-relaxed text-text-secondary">
          {course.termsOffered.length ? course.termsOffered.map((t) => (/^1\d{2}[359]$/.test(t) ? termLabel(t) : t)).join(", ") : "No offering history."}{" "}
          Past offerings are a guide, not a guarantee. Grade data runs through Fall 2024.
        </p>
      </details>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="self-start py-1 text-micro font-medium text-accent underline">
          Open in the UMN catalog ↗
        </a>
      )}
    </div>
  );
}

/**
 * `pinned`: the persistent card (charts under the heading, collapsible description, extras).
 * `hover`: the wide quick look (charts beside the heading, description open, no extras).
 */
export function CourseDetails({ course, variant = "pinned" }: { course: Details; variant?: "pinned" | "hover" }) {
  const charts = (
    <div className="flex min-w-0 items-end gap-4">
      <LetterGradeChart grades={course.grades} className="flex-1" />
      <OtherGradeChart grades={course.grades} />
    </div>
  );
  if (variant === "hover")
    return (
      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-start gap-5">
          <PreviewHeading course={course} className="w-2/5 shrink-0" />
          <div className="min-w-0 flex-1">{charts}</div>
        </div>
        <div className="h-px bg-border" />
        <Facts course={course} />
        <Description text={course.description} alwaysOpen />
        <p className="text-micro text-text-tertiary">Click the course to keep this open.</p>
      </div>
    );
  return (
    <div className="flex flex-col gap-3 px-5 pt-1 pb-4">
      {charts}
      <Facts course={course} />
      <PlanStatus course={course} />
      <Description text={course.description} alwaysOpen={false} />
      <More course={course} />
    </div>
  );
}
