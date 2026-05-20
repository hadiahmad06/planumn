"use client";

import { useEffect, useState } from "react";
import { DisplaySettingsContext } from "@/contexts/visual/DisplaySettingsContext";
import { ColorKey } from "@/types/plan";

export const DisplaySettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [colorKey, setColorKey] = useState<ColorKey>("department");
  const [hiddenSemesters, setHiddenSemesters] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const storedColorKey = localStorage.getItem("colorKey");
    if (storedColorKey) {
      setColorKey(storedColorKey as ColorKey);
    }

    const storedHiddenSemesters = localStorage.getItem("hiddenSemesters");
    if (storedHiddenSemesters) {
      try {
        setHiddenSemesters(JSON.parse(storedHiddenSemesters));
      } catch {
        localStorage.removeItem("hiddenSemesters");
      }
    }
  }, []);

  // Save to localStorage on update
  useEffect(() => {
    localStorage.setItem("colorKey", colorKey);
    window.postMessage({ type: "COLOR_KEY_UPDATE", colorKey }, "*");
  }, [colorKey]);

  useEffect(() => {
    localStorage.setItem("hiddenSemesters", JSON.stringify(hiddenSemesters));
  }, [hiddenSemesters]);

  return (
    <DisplaySettingsContext.Provider value={{ colorKey, setColorKey, hiddenSemesters, setHiddenSemesters }}>
      {children}
    </DisplaySettingsContext.Provider>
  );
};