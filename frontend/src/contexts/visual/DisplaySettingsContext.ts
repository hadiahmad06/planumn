"use client";

import { createContext } from "react";
import { ColorKey } from "@/types/plan";
import {Transposed} from "@/types/plan";

export const DisplaySettingsContext = createContext<{
  colorKey: ColorKey;
  transposed: Transposed;
  setTransposed: (transposed: Transposed) => void;
  setColorKey: (key: ColorKey) => void;
}>({
  colorKey: "department",
  transposed: "row",
  setTransposed: (transposed: Transposed) => {'setTransposed not implemented in context'},
  setColorKey: () => { console.warn("setColorKey not implemented in context") }
});

