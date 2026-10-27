"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Season } from "@/domain/terms";

/**
 * Per-browser display preferences for the schedule (A9, A10, A30). Owned by Hadi's Claude.
 * Michael's Codex renders <DisplaySettingsForm /> (./DisplaySettingsForm.tsx) inside the Settings modal.
 */
export type ColorKey = "department" | "level" | "none";

interface DisplaySettingsState {
  colorKey: ColorKey;
  hiddenSeasons: Season[];
  setColorKey: (k: ColorKey) => void;
  setHiddenSeasons: (s: Season[]) => void;
}

export const useDisplaySettings = create<DisplaySettingsState>()(
  persist(
    (set) => ({
      colorKey: "department",
      hiddenSeasons: [],
      setColorKey: (colorKey) => set({ colorKey }),
      setHiddenSeasons: (hiddenSeasons) => set({ hiddenSeasons }),
    }),
    { name: "planumn:display-settings" },
  ),
);
