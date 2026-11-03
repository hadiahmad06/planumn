"use client";
import { useEffect } from "react";
import { THEME_KEY, THEME_EVENT, themePreference } from "./preferences";
/** Written by Michael's Codex. Keep already-open tabs in sync; never touches plan data. */
export function ThemeController() {
  useEffect(() => {
    function update(event: StorageEvent) {
      if (event.key !== THEME_KEY && event.key !== null) return;
      document.documentElement.dataset.theme = themePreference(event.newValue);
      window.dispatchEvent(new Event(THEME_EVENT));
    }
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);
  return null;
}
