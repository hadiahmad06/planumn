"use client";

import { createContext } from "react";
import { ColorKey } from "@/types/plan";

export const DisplaySettingsContext = createContext<{
  colorKey: ColorKey;
  setColorKey: (key: ColorKey) => void;
}>({
  colorKey: "department",
  setColorKey: () => { console.warn("setColorKey not implemented in context") }
});

