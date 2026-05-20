"use client";

import { createContext } from "react";
import { ColorKey } from "@/types/plan";

export type HiddenSeason = "fall" | "spring" | "summer";

const SEASON_CODE_TO_KEY: Record<string, HiddenSeason> = {
  "9": "fall",
  "3": "spring",
  "5": "summer",
};

export function isSemesterHidden(index: string, hiddenSemesters: string[]): boolean {
  const key = SEASON_CODE_TO_KEY[index[3]];
  return key ? hiddenSemesters.includes(key) : false;
}

export const DisplaySettingsContext = createContext<{
  colorKey: ColorKey;
  setColorKey: (key: ColorKey) => void;
  hiddenSemesters: string[];
  setHiddenSemesters: (seasons: string[]) => void;
}>({
  colorKey: "department",
  setColorKey: () => { console.warn("setColorKey not implemented in context") },
  hiddenSemesters: [],
  setHiddenSemesters: () => { console.warn("setHiddenSemesters not implemented in context") },
});

