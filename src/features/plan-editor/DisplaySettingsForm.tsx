"use client";

import type { Season } from "@/domain/terms";
import { cn } from "@/components/ui/cn";
import { useDisplaySettings, type ColorKey } from "./displaySettings";

const COLOR_OPTIONS: { value: ColorKey; label: string }[] = [
  { value: "department", label: "Department" },
  { value: "level", label: "Level" },
  { value: "none", label: "None" },
];
const SEASONS: { value: Season; label: string }[] = [
  { value: "fall", label: "Fall" },
  { value: "spring", label: "Spring" },
  { value: "summer", label: "Summer" },
];

/**
 * Display settings (A9 card colors, A10 hidden seasons). Owned by Hadi's Claude.
 * Used in the editor's View popover; Michael's Codex also renders it in the Settings modal.
 */
export function DisplaySettingsForm() {
  const { colorKey, setColorKey, hiddenSeasons, setHiddenSeasons } = useDisplaySettings();

  return (
    <div className="flex flex-col gap-4">
      <fieldset>
        <legend className="mb-1.5 text-micro font-semibold tracking-wide text-text-secondary uppercase">Color courses by</legend>
        <div className="flex gap-1 rounded-full bg-sunken p-0.5">
          {COLOR_OPTIONS.map((o) => (
            <label
              key={o.value}
              className={cn(
                "flex-1 cursor-pointer rounded-full px-3 py-1 text-center",
                colorKey === o.value ? "bg-surface font-medium shadow-card" : "text-text-secondary",
              )}
            >
              <input type="radio" name="color-key" value={o.value} checked={colorKey === o.value} onChange={() => setColorKey(o.value)} className="sr-only" />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-1.5 text-micro font-semibold tracking-wide text-text-secondary uppercase">Show semesters</legend>
        <div className="flex flex-col gap-1">
          {SEASONS.map((s) => (
            <label key={s.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!hiddenSeasons.includes(s.value)}
                onChange={(e) =>
                  setHiddenSeasons(e.target.checked ? hiddenSeasons.filter((h) => h !== s.value) : [...hiddenSeasons, s.value])
                }
                className="accent-accent"
              />
              {s.label}
            </label>
          ))}
        </div>
        <p className="mt-1.5 text-micro text-text-tertiary">Hidden semesters keep their courses.</p>
      </fieldset>
    </div>
  );
}
