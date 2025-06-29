"use client";

import { useEffect, useState } from "react";
import { DisplaySettingsContext } from "@/contexts/visual/DisplaySettingsContext";
import { ColorKey } from "@/types/plan";

export const DisplaySettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [colorKey, setColorKey] = useState<ColorKey>("department");

  // Load from localStorage on mount
  useEffect(() => {
    const storedColorKey = localStorage.getItem("colorKey");
    if (storedColorKey) {
      setColorKey(storedColorKey as ColorKey);
    }
  }, []);

  // Save to localStorage on update
  useEffect(() => {
    localStorage.setItem("colorKey", colorKey);
    window.postMessage({ type: "COLOR_KEY_UPDATE", colorKey }, "*");
  }, [colorKey]);

  return (
    <DisplaySettingsContext.Provider value={{ colorKey, setColorKey }}>
      {children}
    </DisplaySettingsContext.Provider>
  );
};