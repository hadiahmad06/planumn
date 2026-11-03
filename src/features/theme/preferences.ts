/** Written by Michael's Codex. Browser-local choice; system uses CSS prefers-color-scheme live. */
export type ThemePreference = "system" | "light" | "dark";
export const THEME_KEY = "planumn:theme:v1";
export const THEME_EVENT = "planumn:theme-change";
export function themePreference(value: unknown): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}
// Static, first-party code only. Installed in root layout before the first page paint.
export const THEME_BOOTSTRAP = `try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});document.documentElement.dataset.theme=t==='light'||t==='dark'?t:'system'}catch{}`;
