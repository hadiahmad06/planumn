"use client";

import { createContext } from "react";
import { ColorKey } from "@/types/plan";
import {Transposed} from "@/types/plan";
import {TheSeasons} from "@/types/plan";

export const DisplaySettingsContext = createContext<{
  colorKey: ColorKey;
  transposed: Transposed;
  theSeasons: TheSeasons;
  setTheSeasons: (theSeasons: TheSeasons) => void;
  setTransposed: (transposed: Transposed) => void;
  setColorKey: (key: ColorKey) => void;
}>({
  colorKey: "department",
  transposed: "row",
  theSeasons: [],
  setTheSeasons: (theSeasons: TheSeasons) => {'setTheSeasons not implemented in context'},
  setTransposed: () => {'setTransposed not implemented in context'},
  setColorKey: () => { console.warn("setColorKey not implemented in context") }
});

