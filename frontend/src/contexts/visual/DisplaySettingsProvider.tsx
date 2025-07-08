"use client";

import { useEffect, useState } from "react";
import { DisplaySettingsContext } from "@/contexts/visual/DisplaySettingsContext";
import { ColorKey } from "@/types/plan";
import { Transposed } from "@/types/plan"

export const DisplaySettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [colorKey, setColorKey] = useState<ColorKey>("department");
  const [transposed, setTransposed] = useState<Transposed>('row');

  // Load from localStorage on mount
  useEffect(() => {
    const storedColorKey = localStorage.getItem("colorKey");
    const storedTransposed = localStorage.getItem("transposed");
    if (storedColorKey) {
      setTransposed(storedTransposed as Transposed);
      setColorKey(storedColorKey as ColorKey);
    }
  }, []);

  // Save to localStorage on update
  useEffect(() => {
    localStorage.setItem("colorKey", colorKey);
    localStorage.setItem("transposed", transposed);
    window.postMessage({ type: "COLOR_KEY_UPDATE", colorKey }, "*");
    window.postMessage({ type: "TRANSPOSED_UPDATE", transposed });
  }, [colorKey]);

  return (
    <DisplaySettingsContext.Provider value={{ colorKey, setColorKey, transposed, setTransposed }}>
      {children}
    </DisplaySettingsContext.Provider>
  );
};