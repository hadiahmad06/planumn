"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Season } from "@/domain/terms";

/**
 * Per-browser display preferences for the schedule (A9, A10, A30). Owned by Hadi's Claude.
 * Michael's Codex renders <DisplaySettingsForm /> (./DisplaySettingsForm.tsx) inside the Settings modal.
 */
export type ColorKey = "department" | "level" | "none";
/** "years": a row per academic year (default). "seasons": transposed, a row per season (A30). */
export type ScheduleLayout = "years" | "seasons";

interface DisplaySettingsState {
  colorKey: ColorKey;
  hiddenSeasons: Season[];
  layout: ScheduleLayout;
  /** Academic years (start year) collapsed in the "years" layout. */
  collapsedYears: number[];
  setColorKey: (k: ColorKey) => void;
  setHiddenSeasons: (s: Season[]) => void;
  setLayout: (l: ScheduleLayout) => void;
  toggleYear: (startYear: number) => void;
}

export const useDisplaySettings = create<DisplaySettingsState>()(
  persist(
    (set) => ({
      colorKey: "department",
      hiddenSeasons: [],
      layout: "years",
      collapsedYears: [],
      setColorKey: (colorKey) => set({ colorKey }),
      setHiddenSeasons: (hiddenSeasons) => set({ hiddenSeasons }),
      setLayout: (layout) => set({ layout }),
      toggleYear: (y) =>
        set((s) => ({ collapsedYears: s.collapsedYears.includes(y) ? s.collapsedYears.filter((x) => x !== y) : [...s.collapsedYears, y] })),
    }),
    { name: "planumn:display-settings" },
  ),
);
