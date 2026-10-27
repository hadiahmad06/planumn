"use client";

import { useState } from "react";
import { formatCredits } from "@/domain/course";
import { groupByYear, missingTermsInYear, type YearGroup } from "@/domain/planOps";
import type { Plan } from "@/domain/plan";
import type { HealthIssue } from "@/domain/health";
import { academicYearLabel, seasonOf, termLabel, toTermCode, type Season } from "@/domain/terms";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/components/ui/cn";
import { DotsIcon, PlusIcon } from "@/components/ui/icons";
import { Menu, MenuItem } from "@/components/ui/Menu";
import { useCreditTotal } from "@/features/catalog/courseCache";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useDisplaySettings } from "./displaySettings";
import { useHealth } from "./useHealth";
import { SemesterColumn } from "./SemesterColumn";
import { planActions } from "./store";

const SEASONS: Season[] = ["fall", "spring", "summer"];

function termOf(startYear: number, season: Season) {
  return toTermCode({ year: season === "fall" ? startYear : startYear + 1, season });
}

function AddSemesterSlot({ term }: { term: string }) {
  return (
    <button
      type="button"
      onClick={() => planActions.addSemester(term)}
      className="flex min-h-40 items-center justify-center gap-1 rounded-card border border-dashed border-border-strong/60 text-micro text-text-tertiary hover:border-accent hover:text-accent"
    >
      <PlusIcon size={12} /> {termLabel(term)}
    </button>
  );
}

function YearMenu({ group, plan, seasons }: { group: YearGroup; plan: Plan; seasons: Season[] }) {
  const [confirming, setConfirming] = useState(false);
  const missing = missingTermsInYear(plan, group.startYear).filter((t) => seasons.includes(seasonOf(t)));
  const courseCount = group.semesters.reduce((n, s) => n + s.courses.length, 0);
  const label = academicYearLabel(group.startYear);
  return (
    <>
      <Menu
        align="start"
        trigger={
          <button type="button" aria-label={`${label} options`} className="rounded-row p-0.5 text-text-tertiary hover:bg-surface hover:text-text-primary">
            <DotsIcon />
          </button>
        }
      >
        {missing.map((t) => (
          <MenuItem key={t} onSelect={() => planActions.addSemester(t)}>
            Add {termLabel(t)}
          </MenuItem>
        ))}
        <MenuItem danger onSelect={() => (courseCount ? setConfirming(true) : planActions.removeYear(group.startYear))}>
          Remove {label}
        </MenuItem>
      </Menu>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Remove ${label}?`}
        description={`All ${group.semesters.length} semesters and their ${courseCount} course${courseCount === 1 ? "" : "s"} will be removed from the plan.`}
        confirmLabel="Remove year"
        onConfirm={() => planActions.removeYear(group.startYear)}
      />
    </>
  );
}

/** Default layout: one row per academic year; each row collapses to a summary (A30). */
function YearRow({ group, plan, seasons, issues, columns }: { group: YearGroup; plan: Plan; seasons: Season[]; issues: Map<string, HealthIssue[]>; columns: number }) {
  const collapsed = useDisplaySettings((s) => s.collapsedYears.includes(group.startYear));
  const toggleYear = useDisplaySettings((s) => s.toggleYear);
  const ids = group.semesters.flatMap((s) => s.courses.map((c) => c.id));
  const credits = useCreditTotal(ids);
  const label = academicYearLabel(group.startYear);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => toggleYear(group.startYear)} aria-expanded={!collapsed} className="flex items-center gap-1.5 rounded-row font-semibold hover:text-accent">
          <span aria-hidden className={cn("inline-block text-micro text-text-tertiary transition-transform", !collapsed && "rotate-90")}>▶</span>
          {label}
        </button>
        <span className="text-micro text-text-tertiary">
          {ids.length} {ids.length === 1 ? "course" : "courses"} · {formatCredits(credits)} cr
        </span>
        <YearMenu group={group} plan={plan} seasons={seasons} />
      </div>
      {!collapsed && (
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {seasons.map((season) => {
            const semester = group.semesters.find((s) => seasonOf(s.index) === season);
            if (semester) return <SemesterColumn key={semester.index} semester={semester} issues={issues} />;
            return <AddSemesterSlot key={season} term={termOf(group.startYear, season)} />;
          })}
        </div>
      )}
    </div>
  );
}

/** Transposed layout: one row per season, academic years across (A30, 2025 "transpose"). */
function SeasonGrid({ plan, years, seasons, issues }: { plan: Plan; years: YearGroup[]; seasons: Season[]; issues: Map<string, HealthIssue[]> }) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid gap-3" style={{ gridTemplateColumns: `5rem repeat(${years.length}, minmax(13rem, 1fr))` }}>
        <span />
        {years.map((g) => (
          <div key={g.startYear} className="flex items-center gap-1.5 font-semibold">
            {academicYearLabel(g.startYear)}
            <YearMenu group={g} plan={plan} seasons={seasons} />
          </div>
        ))}
        {seasons.map((season) => (
          <div key={season} className="contents">
            <span className="pt-2 text-micro font-semibold tracking-wide text-text-secondary uppercase">{season}</span>
            {years.map((g) => {
              const semester = g.semesters.find((s) => seasonOf(s.index) === season);
              return semester ? (
                <SemesterColumn key={semester.index} semester={semester} issues={issues} />
              ) : (
                <AddSemesterSlot key={`${g.startYear}-${season}`} term={termOf(g.startYear, season)} />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Schedule({ plan }: { plan: Plan }) {
  const hidden = useDisplaySettings((s) => s.hiddenSeasons);
  const layout = useDisplaySettings((s) => s.layout);
  const mobile = useIsMobile();
  const seasons = SEASONS.filter((s) => !hidden.includes(s));
  const years = groupByYear(plan.semesters);
  const issues = useHealth(plan).byCourse;

  return (
    <div className="flex flex-col gap-6">
      <button type="button" onClick={planActions.addYearAtStart} className="flex items-center gap-1 self-start text-micro text-text-tertiary hover:text-accent">
        <PlusIcon size={12} /> Add earlier year
      </button>
      {layout === "seasons" && !mobile ? (
        <SeasonGrid plan={plan} years={years} seasons={seasons} issues={issues} />
      ) : (
        years.map((g) => <YearRow key={g.startYear} group={g} plan={plan} seasons={seasons} issues={issues} columns={mobile ? 1 : seasons.length} />)
      )}
      <div className="flex flex-wrap gap-4">
        <button type="button" onClick={planActions.addYearAtEnd} className="flex items-center gap-1 text-body text-text-secondary hover:text-accent">
          <PlusIcon /> Add year
        </button>
        <button type="button" onClick={() => planActions.addNextSemester(hidden)} className="flex items-center gap-1 text-body text-text-secondary hover:text-accent">
          <PlusIcon /> Add next semester
        </button>
      </div>
    </div>
  );
}
