"use client";

import { useEffect, useState } from "react";
import { DisplaySettingsContext } from "@/contexts/visual/DisplaySettingsContext";
import { ColorKey } from "@/types/plan";
import { Transposed } from "@/types/plan"
import { TheSeasons } from "@/types/plan";

export const DisplaySettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [colorKey, setColorKey] = useState<ColorKey>("department");
  const [transposed, setTransposed] = useState<Transposed>('row');
  const [theSeasons, setTheSeasons] = useState<TheSeasons>(['🍂 Fall', '🌱 Spring', '☀️ Summer'])

  // Load from localStorage on mount
  useEffect(() => {
    const storedtheSeasons = localStorage.getItem("theSeasons");
    const storedColorKey = localStorage.getItem("colorKey");
    const storedTransposed = localStorage.getItem("transposed");
    if (storedColorKey)
      setColorKey(storedColorKey as ColorKey)
    if (storedTransposed)
      setTransposed(storedTransposed as Transposed);
    if (storedtheSeasons && storedtheSeasons !== "undefined") {
      setTheSeasons(JSON.parse(storedtheSeasons) as TheSeasons);
    }
  }, []);

  // Save to localStorage on update
  useEffect(() => {
    localStorage.setItem("colorKey", colorKey);
    window.postMessage({ type: "COLOR_KEY_UPDATE", colorKey }, "*");
  }, [colorKey]);

  useEffect(() => {
    localStorage.setItem("transposed", transposed);
    window.postMessage({ type: "TRANSPOSED_UPDATE", transposed }, "*");
  }, [transposed]);

  useEffect(() => {
    if (theSeasons) {
      localStorage.setItem("theSeasons", JSON.stringify(theSeasons));
      window.postMessage({ type: "THE_SEASONS_UPDATE", theSeasons }, "*");
    }
  }, [theSeasons]);

  return (
    <DisplaySettingsContext.Provider value={{ colorKey, setColorKey, transposed, setTransposed, theSeasons, setTheSeasons }}>
      {children}
    </DisplaySettingsContext.Provider>
  );
};