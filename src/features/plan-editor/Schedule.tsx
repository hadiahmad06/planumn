"use client";

import { useState } from "react";
import { groupByYear, missingTermsInYear, type YearGroup } from "@/domain/planOps";
import type { Plan } from "@/domain/plan";
import { academicYearLabel, seasonOf, termLabel, type Season } from "@/domain/terms";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DotsIcon, PlusIcon } from "@/components/ui/icons";
import { Menu, MenuItem } from "@/components/ui/Menu";
import { useDisplaySettings } from "./displaySettings";
import { SemesterColumn } from "./SemesterColumn";
import { planActions } from "./store";

const SEASONS: Season[] = ["fall", "spring", "summer"];

function YearRow({ group, plan, seasons }: { group: YearGroup; plan: Plan; seasons: Season[] }) {
  const [confirming, setConfirming] = useState(false);
  const missing = missingTermsInYear(plan, group.startYear).filter((t) => seasons.includes(seasonOf(t)));
  const courseCount = group.semesters.reduce((n, s) => n + s.courses.length, 0);
  const label = academicYearLabel(group.startYear);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <h2 className="text-body font-semibold text-text-primary">{label}</h2>
        <Menu
          align="start"
          trigger={
            <button type="button" aria-label={`${label} options`} className="rounded-row p-0.5 text-text-tertiary hover:bg-surface hover:text-text-primary">
              <DotsIcon />
            </button>
          }
        >
          {missing.map((t) => (
            <MenuItem key={t} onSelect={() => planActions.addSemester(t)}>Add {termLabel(t)}</MenuItem>
          ))}
          <MenuItem danger onSelect={() => (courseCount ? setConfirming(true) : planActions.removeYear(group.startYear))}>
            Remove {label}
          </MenuItem>
        </Menu>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${seasons.length}, minmax(0, 1fr))` }}>
        {seasons.map((season) => {
          const semester = group.semesters.find((s) => seasonOf(s.index) === season);
          if (semester) return <SemesterColumn key={semester.index} semester={semester} />;
          const term = missing.find((t) => seasonOf(t) === season);
          return (
            <button
              key={season}
              type="button"
              onClick={() => term && planActions.addSemester(term)}
              className="flex min-h-40 items-center justify-center gap-1 rounded-card border border-dashed border-border-strong/60 text-micro text-text-tertiary hover:border-accent hover:text-accent"
            >
              <PlusIcon size={12} /> {term ? termLabel(term) : season}
            </button>
          );
        })}
      </div>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Remove ${label}?`}
        description={`All ${group.semesters.length} semesters and their ${courseCount} courses will be removed from the plan.`}
        confirmLabel="Remove year"
        onConfirm={() => planActions.removeYear(group.startYear)}
      />
    </div>
  );
}

export function Schedule({ plan }: { plan: Plan }) {
  const hidden = useDisplaySettings((s) => s.hiddenSeasons);
  const seasons = SEASONS.filter((s) => !hidden.includes(s));
  const years = groupByYear(plan.semesters);

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={planActions.addYearAtStart}
        className="flex items-center gap-1 self-start text-micro text-text-tertiary hover:text-accent"
      >
        <PlusIcon size={12} /> Add earlier year
      </button>
      {years.map((g) => (
        <YearRow key={g.startYear} group={g} plan={plan} seasons={seasons} />
      ))}
      <div className="flex gap-4">
        <button type="button" onClick={planActions.addYearAtEnd} className="flex items-center gap-1 text-body text-text-secondary hover:text-accent">
          <PlusIcon /> Add year
        </button>
        <button type="button" onClick={planActions.addNextSemester} className="flex items-center gap-1 text-body text-text-secondary hover:text-accent">
          <PlusIcon /> Add next semester
        </button>
      </div>
    </div>
  );
}
