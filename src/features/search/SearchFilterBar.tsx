"use client";

import type { ReactNode } from "react";
import { TWIN_CITIES_LIBED } from "@/domain/libed";
import { hasFilters, LEVELS, MIN_GPAS, SEASONS, type SearchFilters } from "@/domain/searchFilters";
import type { Season } from "@/domain/terms";
import { cn } from "@/components/ui/cn";
import type { RequirementOption } from "@/features/requirements/requirementOptions";

const SEASON_LABEL: Record<Season, string> = { fall: "Fall", spring: "Spring", summer: "Summer" };
const CREDITS = [1, 2, 3, 4, 5, 6];

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "max-w-44 rounded-full border bg-surface px-2.5 py-1 text-micro outline-none focus-visible:border-accent",
        value ? "border-accent text-accent" : "border-border text-text-secondary",
      )}
    >
      {children}
    </select>
  );
}

/**
 * B8 smart search filters, shown at the top of the search dropdown. Offering season and average GPA
 * come from past grades (through Fall 2024); Lib Ed comes from the UMN catalog. "Requirement" lists the
 * plan's program requirements and keeps only the courses that requirement lists.
 */
export function SearchFilterBar({
  filters,
  onChange,
  requirements,
  requirement,
  onRequirement,
}: {
  filters: SearchFilters;
  onChange: (f: SearchFilters) => void;
  requirements: RequirementOption[];
  requirement: string | null;
  onRequirement: (key: string | null) => void;
}) {
  const set = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K] | undefined) => {
    const next = { ...filters };
    if (value === undefined || value === false) delete next[key];
    else next[key] = value;
    onChange(next);
  };
  const num = (v: string) => (v ? Number(v) : undefined);
  const programs = [...new Set(requirements.map((r) => r.programName))];

  return (
    <div role="group" aria-label="Search filters" data-search-filters className="flex flex-wrap items-center gap-1.5 border-b border-border px-2 pt-1 pb-2">
      {filters.dept && (
        <button
          type="button"
          onClick={() => set("dept", undefined)}
          aria-label={`Remove department filter ${filters.dept}`}
          className="flex items-center gap-1 rounded-full border border-accent bg-surface px-2.5 py-1 text-micro text-accent"
        >
          {filters.dept} <span aria-hidden>×</span>
        </button>
      )}
      {requirements.length > 0 && (
        <FilterSelect label="Satisfies requirement" value={requirement ?? ""} onChange={(v) => onRequirement(v || null)}>
          <option value="">Requirement: any</option>
          {programs.map((name) => (
            <optgroup key={name} label={name}>
              {requirements
                .filter((r) => r.programName === name)
                .map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.name}
                    {r.satisfied ? " (done)" : ""}
                  </option>
                ))}
            </optgroup>
          ))}
        </FilterSelect>
      )}
      <FilterSelect label="Lib Ed designation" value={filters.libEd ?? ""} onChange={(v) => set("libEd", v || undefined)}>
        <option value="">Lib Ed: any</option>
        {TWIN_CITIES_LIBED.map((d) => (
          <option key={d.code} value={d.code}>
            {d.label}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect label="Offered in" value={filters.season ?? ""} onChange={(v) => set("season", (v || undefined) as Season | undefined)}>
        <option value="">Offered: any term</option>
        {SEASONS.map((s) => (
          <option key={s} value={s}>
            Offered in {SEASON_LABEL[s]}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect label="Level" value={filters.level?.toString() ?? ""} onChange={(v) => set("level", num(v))}>
        <option value="">Level: any</option>
        {LEVELS.map((l) => (
          <option key={l} value={l}>
            {l === 5000 ? "5xxx and up" : `${l / 1000}xxx`}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect label="Credits" value={filters.credits?.toString() ?? ""} onChange={(v) => set("credits", num(v))}>
        <option value="">Credits: any</option>
        {CREDITS.map((c) => (
          <option key={c} value={c}>
            {c} credit{c === 1 ? "" : "s"}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect label="Minimum average GPA" value={filters.minGpa?.toString() ?? ""} onChange={(v) => set("minGpa", num(v))}>
        <option value="">Avg GPA: any</option>
        {MIN_GPAS.map((g) => (
          <option key={g} value={g}>
            Avg GPA {g.toFixed(2)}+
          </option>
        ))}
      </FilterSelect>
      <label
        title="Read from the catalog description, which can be incomplete: check the catalog before registering."
        className={cn(
          "flex cursor-pointer items-center gap-1.5 rounded-full border bg-surface px-2.5 py-1 text-micro",
          filters.noPrereqs ? "border-accent text-accent" : "border-border text-text-secondary",
        )}
      >
        <input type="checkbox" checked={Boolean(filters.noPrereqs)} onChange={(e) => set("noPrereqs", e.target.checked)} className="accent-current" />
        No prerequisites <span className="text-text-tertiary">(per catalog text)</span>
      </label>
      {(hasFilters(filters) || requirement) && (
        <button
          type="button"
          onClick={() => {
            onChange({});
            onRequirement(null);
          }} className="px-1.5 text-micro text-text-tertiary hover:text-accent">
          Clear
        </button>
      )}
    </div>
  );
}
