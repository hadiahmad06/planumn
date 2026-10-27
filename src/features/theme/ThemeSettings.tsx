"use client";
import { useId, useState, useSyncExternalStore } from "react";
import {
  THEME_EVENT,
  THEME_KEY,
  themePreference,
  type ThemePreference,
} from "./preferences";
const subscribe = (notify: () => void) => {
  window.addEventListener(THEME_EVENT, notify);
  return () => window.removeEventListener(THEME_EVENT, notify);
};
const snapshot = () => themePreference(document.documentElement.dataset.theme);
const serverSnapshot = (): ThemePreference => "system";
/** Written by Michael's Codex. Native radios remain usable with keyboard/assistive technology. */
export function ThemeSettings() {
  const selected = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const group = useId();
  const [error, setError] = useState("");
  function choose(value: ThemePreference) {
    document.documentElement.setAttribute("data-theme", value);
    window.dispatchEvent(new Event(THEME_EVENT));
    try {
      localStorage.setItem(THEME_KEY, value);
      setError("");
    } catch {
      setError(
        "Theme changed for this tab. This browser could not remember the preference.",
      );
    }
  }
  return (
    <fieldset className="space-y-3">
      <legend className="mb-2 font-semibold">Appearance</legend>
      <div className="flex flex-wrap gap-4">
        {(["system", "light", "dark"] as const).map((value) => (
          <label
            key={value}
            className="flex cursor-pointer items-center gap-2 text-sm"
          >
            <input
              type="radio"
              name={group}
              value={value}
              checked={selected === value}
              onChange={() => choose(value)}
            />
            {value[0].toUpperCase() + value.slice(1)}
          </label>
        ))}
      </div>
      <p className="text-xs text-text-secondary">
        System follows your device’s appearance. This choice is saved only in
        this browser.
      </p>
      {error && (
        <p role="status" className="text-xs text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
