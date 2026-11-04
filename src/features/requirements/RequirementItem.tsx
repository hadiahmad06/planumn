"use client";

import { useDraggable } from "@dnd-kit/core";
import { useId, useState } from "react";
import { describePattern, patternSearchLinks, type CoursePattern, type PatternMatch } from "@/domain/coursePatterns";
import { describeConstraint, type ConstraintProgress } from "@/domain/creditConstraints";
import type { ApasPair } from "@/domain/apasCompare";
import type { CourseChoice, CourseOption, RequirementResult, RuleResult } from "@/domain/requirements";
import { cn } from "@/components/ui/cn";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { externalId, type DragData } from "@/features/plan-editor/dnd";
import { usePreviewStore } from "@/features/preview/store";
import { ActionMenu } from "@/components/ui/Menu";
import { useIsMobile } from "@/hooks/useIsMobile";
import { addCourseActions } from "@/features/plan-editor/courseActions";
import { useDisplaySettings } from "@/features/plan-editor/displaySettings";
import { hoverCourse, usePlanStore } from "@/features/plan-editor/store";
import { AddToSemesterButton } from "@/features/plan-editor/AddToSemesterButton";
import { openSearchWith } from "@/features/search/searchRequest";
import { ApasSaysLine } from "./ApasSays";

const MAX_CHOICES = 8;

/** A listed course: draggable into the schedule, click for its preview (A27). Also used by the B12 finder. */
export function OptionChip({ option, primary, planned }: { option: CourseOption; primary?: boolean; planned?: boolean }) {
  const mobile = useIsMobile();
  const plan = usePlanStore((s) => s.plan);
  const hidden = useDisplaySettings((s) => s.hiddenSeasons);
  const openPreview = usePreviewStore((s) => s.openPreview);
  const id = option.courseId;
  const data: DragData | undefined = id == null ? undefined : { type: "external", source: "requirement", courseId: id };
  // The same course can be listed in several requirements, so each chip needs its own drag id.
  const instance = useId();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: externalId(`req${instance}`, id ?? 0),
    data,
    disabled: id == null || mobile,
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
  const className = cn(
    "min-w-0 cursor-grab truncate rounded-row text-left hover:text-accent",
    primary ? "font-medium" : "text-micro text-text-secondary underline decoration-dotted underline-offset-2",
    planned && "text-success",
    isDragging && "opacity-40",
  );
  const content = (
    <>
      {label}
      {primary && option.title ? <span className="font-normal text-text-secondary"> · {option.title}</span> : null}
    </>
  );
  if (mobile) {
    return (
      <ActionMenu
        actions={addCourseActions(id, plan, hidden)}
        trigger={
          <button type="button" className={className}>
            {content}
          </button>
        }
      />
    );
  }
  const chip = (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      onClick={() => openPreview(id)}
      onMouseEnter={() => hoverCourse(id)}
      onMouseLeave={() => hoverCourse(null)}
      className={className}
    >
      {content}
    </button>
  );
  // Primary rows get a "+" (add to the selected semester); inline "or …" alternatives stay text-only.
  if (!primary) return chip;
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      {chip}
      {!planned && <AddToSemesterButton courseId={id} code={option.code} className="ml-auto size-5" />}
    </span>
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

/** The catalog's description of a rule (C1): visible, clamped to three lines until expanded. */
function RuleDescription({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 220;
  return (
    <div className="text-micro text-text-secondary">
      <p className={cn("whitespace-pre-line", long && !open && "line-clamp-3")}>{text}</p>
      {long && (
        <button type="button" onClick={() => setOpen(!open)} className="text-accent hover:underline">
          {open ? "Less" : "More"}
        </button>
      )}
    </div>
  );
}

/**
 * The heading of a C2/C3 box. Hadi, 2026-11-03: readings count once C4 agrees with APAS, always with a
 * disclaimer that planu.mn isn't UMN's official audit. Counted readings say so and carry the disclaimer
 * visibly; the rest stay "not counted in progress".
 */
function CatalogTextLabel({ counted, what }: { counted?: boolean; what: string }) {
  if (!counted)
    return (
      <p
        className="text-text-tertiary"
        title={`planu.mn read ${what} from the catalog's wording, so it may be off. It isn't counted in your progress yet; APAS or your advisor has the final word.`}
      >
        Read from catalog text · not counted in progress
      </p>
    );
  return (
    <>
      <p
        className="text-text-tertiary"
        title={`planu.mn read ${what} from the catalog's wording and checked it against real APAS reports for this program, so it counts in your progress. The wording can still be misread, and the catalog can change.`}
      >
        Read from catalog text · counted in progress
      </p>
      <p className="text-text-tertiary">
        planu.mn is a student-made planner, not UMN&apos;s official degree audit. Run APAS or ask your advisor before relying on this.
      </p>
    </>
  );
}

/**
 * C2: credit constraints planu.mn read from the catalog's wording. Hadi, 2026-10-28: show first; they
 * count toward progress only for programs C4 checked against APAS (`CATALOG_TEXT_COUNTED`).
 */
function CreditConstraints({ items, counted }: { items: ConstraintProgress[]; counted?: boolean }) {
  return (
    <div className="rounded-row border border-dashed border-border px-2 py-1.5 text-micro">
      <CatalogTextLabel counted={counted} what="these credit limits" />
      <ul>
        {items.map((p, i) => (
          <li key={i} title={p.constraint.sentence} className="flex items-baseline gap-2">
            <span className={cn("text-text-secondary", p.met && "text-success")}>
              {describeConstraint(p.constraint)}
              {p.constraint.source === "override" ? " (corrected by planu.mn)" : ""}
            </span>
            <span className="ml-auto shrink-0 text-text-tertiary">{p.planned == null ? "can't check" : `${p.planned} cr planned`}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * C3: a course pattern planu.mn read from the catalog's wording for a rule that lists no courses
 * ("4xxx/5xxx EE, excluding EE 4981H"). Hadi, 2026-10-28: show first; matching planned courses count
 * (toward the credit limits around them) only for programs C4 checked against APAS.
 */
function CoursePatternBox({ pattern, matches, counted }: { pattern: CoursePattern; matches: PatternMatch[]; counted?: boolean }) {
  const searches = patternSearchLinks(pattern);
  return (
    <div className="flex flex-col gap-0.5 rounded-row border border-dashed border-border px-2 py-1.5 text-micro">
      <CatalogTextLabel counted={counted} what="this course pattern" />
      <p className="text-text-secondary" title={pattern.sentences.join("\n")}>
        Courses matching {describePattern(pattern)}
      </p>
      {pattern.exclude.length > 0 && <p className="text-text-secondary">Excluding {pattern.exclude.join(", ")}</p>}
      {pattern.include.length > 0 && <p className="text-text-secondary">Also counts: {pattern.include.join(", ")}</p>}
      <p className={matches.length ? "text-success" : "text-text-tertiary"}>
        {matches.length ? `Planned: ${matches.map((m) => `${m.code} (${m.credits} cr)`).join(", ")}` : "No planned course matches yet"}
      </p>
      {searches.length > 0 && (
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-text-tertiary">Find courses:</span>
          {searches.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => openSearchWith({ ...(s.dept ? { dept: s.dept } : {}), ...(s.level ? { level: s.level } : {}) })}
              title={`Open course search filtered to ${s.dept ?? "any department"}${s.level ? `, level ${s.level === 5000 ? "5xxx and up" : `${s.level / 1000}xxx`}` : ""}`}
              className="text-accent hover:underline"
            >
              {s.label}
            </button>
          ))}
        </p>
      )}
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
  if (r.rule.kind === "numberOf") {
    const count = r.rule.count ?? 1;
    const total = r.rule.totalCourses;
    return `${Math.min(r.areas ?? 0, count)}/${count} areas` + (total ? ` · ${Math.min(r.coursesCount ?? 0, total)}/${total} courses` : "");
  }
  if (r.rule.kind === "allOf") return r.units ? `${r.filled}/${r.units}` : null;
  return null;
}

/** C4: APAS pairs for one requirement: the requirement's own, and its rules' by rule id. */
export interface RequirementApas {
  requirement?: ApasPair;
  rules: Map<string, ApasPair>;
}

function RuleView({ result, depth, hideTitle, apas }: { result: RuleResult; depth: number; hideTitle?: boolean; apas?: Map<string, ApasPair> }) {
  const [showAll, setShowAll] = useState(false);
  const { rule } = result;
  const status = ruleStatus(result);
  const apasPair = apas?.get(rule.id);

  return (
    <div className={cn("flex flex-col gap-1", depth > 0 && "border-l border-border pl-2.5")}>
      {!hideTitle && (
        <div className="flex items-baseline gap-2">
          <span className={cn("font-medium", result.satisfied && result.units > 0 ? "text-success" : "text-text-primary")}>{rule.name}</span>
          {status && <span className="ml-auto shrink-0 text-micro text-text-tertiary">{status}</span>}
        </div>
      )}
      {apasPair && <ApasSaysLine pair={apasPair} />}
      {rule.description && <RuleDescription text={rule.description} />}
      {result.constraints?.length ? <CreditConstraints items={result.constraints} counted={result.catalogTextCounted} /> : null}
      {rule.pattern && <CoursePatternBox pattern={rule.pattern} matches={result.patternMatches ?? []} counted={result.catalogTextCounted} />}
      {rule.notes && <Notes text={rule.notes} />}
      {rule.kind === "numberOf" && (
        <p className="text-micro text-text-secondary">
          Complete {rule.count ?? 1} of these {rule.children.length}
          {rule.totalCourses ? `, ${rule.totalCourses} courses in all` : ""}. A course counts in one of them only.
        </p>
      )}
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
              <RuleView result={c} depth={depth + 1} apas={apas} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** One requirement as an accordion item: progress ring, name, x/y; expands into its rules (A24–A25). */
export function RequirementItem({ result, defaultOpen, apas }: { result: RequirementResult; defaultOpen?: boolean; apas?: RequirementApas }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const { requirement } = result;
  const single = result.rules.length === 1 && result.rules[0].rule.name.trim() === requirement.name.trim();
  const inside = apas ? [...apas.rules.values()] : [];
  const insideDisagree = inside.filter((p) => p.verdict === "disagree").length;

  return (
    <li className="rounded-card bg-surface shadow-card">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left">
        <ProgressRing value={result.filled} total={result.units} />
        <span className="min-w-0 flex-1 font-medium">{requirement.name}</span>
        <span className="shrink-0 text-micro text-text-secondary">
          {result.filled}/{result.units}
        </span>
      </button>
      {apas?.requirement && (
        <div className="-mt-1 px-3 pb-2">
          <ApasSaysLine pair={apas.requirement} />
        </div>
      )}
      {!apas?.requirement && inside.length > 0 && !open && (
        <p className="-mt-1 px-3 pb-2 text-micro text-text-tertiary">
          APAS compared {inside.length} part{inside.length === 1 ? "" : "s"} inside
          {insideDisagree > 0 && <span className="font-medium text-warning"> · {insideDisagree} disagree{insideDisagree === 1 ? "s" : ""}</span>}
        </p>
      )}
      {open && (
        <div className="flex flex-col gap-3 border-t border-border px-3 py-2.5">
          {requirement.notes && <Notes text={requirement.notes} />}
          {result.constraints?.length ? <CreditConstraints items={result.constraints} counted={result.catalogTextCounted} /> : null}
          {result.rules.map((r) => (
            <RuleView key={r.rule.id} result={r} depth={0} hideTitle={single} apas={apas?.rules} />
          ))}
        </div>
      )}
    </li>
  );
}
