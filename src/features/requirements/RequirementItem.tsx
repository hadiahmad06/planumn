"use client";

import { useDraggable } from "@dnd-kit/core";
import { useId, useState } from "react";
import type { CourseChoice, CourseOption, RequirementResult, RuleResult } from "@/domain/requirements";
import { cn } from "@/components/ui/cn";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { externalId, type DragData } from "@/features/plan-editor/dnd";
import { usePreviewStore } from "@/features/preview/store";

const MAX_CHOICES = 8;

/** A listed course: draggable into the schedule, click for its preview (A27). */
function OptionChip({ option, primary, planned }: { option: CourseOption; primary?: boolean; planned?: boolean }) {
  const openPreview = usePreviewStore((s) => s.openPreview);
  const hoverPreview = usePreviewStore((s) => s.hoverPreview);
  const id = option.courseId;
  const data: DragData | undefined = id == null ? undefined : { type: "external", source: "requirement", courseId: id };
  // The same course can be listed in several requirements, so each chip needs its own drag id.
  const instance = useId();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: externalId(`req${instance}`, id ?? 0),
    data,
    disabled: id == null,
  });
  const label = option.code ?? "Other approved course";

  if (id == null) {
    return (
      <span
        title={option.title ? `${option.title} isn't in planu.mn's course data yet` : "Not in planu.mn's course data"}
        className={cn("text-text-tertiary", primary ? "" : "text-micro")}
      >
        {label}
        {primary && option.title ? ` · ${option.title}` : ""}
      </span>
    );
  }
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      onClick={() => openPreview(id)}
      onMouseEnter={() => hoverPreview(id)}
      onMouseLeave={() => hoverPreview(null)}
      className={cn(
        "min-w-0 cursor-grab truncate rounded-row text-left hover:text-accent",
        primary ? "font-medium" : "text-micro text-text-secondary underline decoration-dotted underline-offset-2",
        planned && "text-success",
        isDragging && "opacity-40",
      )}
    >
      {label}
      {primary && option.title ? <span className="font-normal text-text-secondary"> · {option.title}</span> : null}
    </button>
  );
}

function Check({ on }: { on: boolean }) {
  return (
    <span
      aria-label={on ? "Planned" : "Not planned"}
      className={cn(
        "mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-[3px] border",
        on ? "border-success bg-success text-surface" : "border-border-strong bg-surface",
      )}
    >
      {on && (
        <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M2.5 6.2l2.3 2.3 4.7-5" />
        </svg>
      )}
    </span>
  );
}

function ChoiceRow({ choice, match }: { choice: CourseChoice; match: number | null }) {
  const planned = choice.options.find((o) => o.courseId != null && o.courseId === match);
  const primary = planned ?? choice.options.find((o) => o.courseId != null) ?? choice.options[0];
  if (!primary) return null;
  const alternatives = choice.options.filter((o) => o !== primary && (o.code || o.courseId != null));
  return (
    <li className="flex items-start gap-2 py-0.5">
      <Check on={match != null} />
      <div className="flex min-w-0 flex-1 flex-col">
        <OptionChip option={primary} primary planned={match != null} />
        {alternatives.length > 0 && (
          <span className="flex flex-wrap items-baseline gap-x-1.5 text-micro text-text-tertiary">
            or {alternatives.map((o) => <OptionChip key={o.groupId} option={o} />)}
          </span>
        )}
      </div>
    </li>
  );
}

function Notes({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="text-micro text-text-tertiary">
      <button type="button" onClick={() => setOpen(!open)} className="underline decoration-dotted underline-offset-2 hover:text-text-secondary">
        {open ? "Hide notes" : "Notes"}
      </button>
      {open && <p className="mt-1 whitespace-pre-line">{text}</p>}
    </div>
  );
}

function ruleStatus(r: RuleResult): string | null {
  if (r.rule.kind === "courses") {
    const { minCourses, minCredits } = r.rule;
    if (minCourses === 0 && minCredits === 0) return "optional";
    const parts = [];
    if (minCourses > 0) parts.push(`${Math.min(r.coursesCount ?? 0, minCourses)}/${minCourses} course${minCourses === 1 ? "" : "s"}`);
    if (minCredits > 0) parts.push(`${r.credits ?? 0}/${minCredits} cr`);
    return parts.join(" · ");
  }
  if (r.rule.kind === "anyOf") return r.units ? "choose one" : null;
  if (r.rule.kind === "allOf") return r.units ? `${r.filled}/${r.units}` : null;
  return null;
}

function RuleView({ result, depth, hideTitle }: { result: RuleResult; depth: number; hideTitle?: boolean }) {
  const [showAll, setShowAll] = useState(false);
  const { rule } = result;
  const status = ruleStatus(result);

  return (
    <div className={cn("flex flex-col gap-1", depth > 0 && "border-l border-border pl-2.5")}>
      {!hideTitle && (
        <div className="flex items-baseline gap-2">
          <span className={cn("font-medium", result.satisfied && result.units > 0 ? "text-success" : "text-text-primary")}>{rule.name}</span>
          {status && <span className="ml-auto shrink-0 text-micro text-text-tertiary">{status}</span>}
        </div>
      )}
      {rule.notes && <Notes text={rule.notes} />}
      {rule.kind === "text" && <p className="text-text-secondary">{rule.text}</p>}
      {rule.kind === "courses" && (
        <ul>
          {(showAll ? rule.choices : rule.choices.slice(0, MAX_CHOICES)).map((choice, i) => (
            <ChoiceRow key={i} choice={choice} match={result.choiceMatches?.[i] ?? null} />
          ))}
          {rule.choices.length > MAX_CHOICES && (
            <li>
              <button type="button" onClick={() => setShowAll(!showAll)} className="text-micro text-accent hover:underline">
                {showAll ? "Show fewer" : `Show all ${rule.choices.length}`}
              </button>
            </li>
          )}
        </ul>
      )}
      {result.children && (
        <div className="flex flex-col gap-2">
          {result.children.map((c, i) => (
            <div key={c.rule.id} className="flex flex-col gap-1">
              {rule.kind === "anyOf" && i > 0 && <span className="text-micro font-semibold tracking-wide text-text-tertiary uppercase">or</span>}
              <RuleView result={c} depth={depth + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** One requirement as an accordion item: progress ring, name, x/y; expands into its rules (A24–A25). */
export function RequirementItem({ result, defaultOpen }: { result: RequirementResult; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const { requirement } = result;
  const single = result.rules.length === 1 && result.rules[0].rule.name.trim() === requirement.name.trim();

  return (
    <li className="rounded-card bg-surface shadow-card">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left">
        <ProgressRing value={result.filled} total={result.units} />
        <span className="min-w-0 flex-1 font-medium">{requirement.name}</span>
        <span className="shrink-0 text-micro text-text-secondary">
          {result.filled}/{result.units}
        </span>
      </button>
      {open && (
        <div className="flex flex-col gap-3 border-t border-border px-3 py-2.5">
          {requirement.notes && <Notes text={requirement.notes} />}
          {result.rules.map((r) => (
            <RuleView key={r.rule.id} result={r} depth={0} hideTitle={single} />
          ))}
        </div>
      )}
    </li>
  );
}
