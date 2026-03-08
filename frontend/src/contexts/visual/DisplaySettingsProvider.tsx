"use client";

import { useEffect, useState } from "react";
import { DisplaySettingsContext } from "@/contexts/visual/DisplaySettingsContext";
import { ColorKey } from "@/types/plan";

export const DisplaySettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [colorKey, setColorKey] = useState<ColorKey>("department");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const storedColorKey = localStorage.getItem("colorKey");
      if (storedColorKey) {
        setColorKey(storedColorKey as ColorKey);
      }
    }
  }, [mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("colorKey", colorKey);
      window.postMessage({ type: "COLOR_KEY_UPDATE", colorKey }, "*");
    }
  }, [colorKey, mounted]);

  return (
    <DisplaySettingsContext.Provider value={{ colorKey, setColorKey }}>
      {children}
    </DisplaySettingsContext.Provider>
  );
};
