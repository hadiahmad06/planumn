"use client";

import { useLayoutEffect } from "react";
import "./globals.css";
import { ErrorScreen, tryAgain, type ErrorPageProps } from "@/features/errors/ErrorScreen";
import { THEME_KEY, themePreference } from "@/features/theme/preferences";

/**
 * L6 (Hadi's Claude, 2026-11-22): shown when the root layout itself fails, so it renders its own
 * document. The root layout's theme bootstrap doesn't run here, so the saved theme is applied again
 * (without one, `globals.css` follows the OS through prefers-color-scheme).
 */
export default function GlobalError(props: ErrorPageProps) {
  useLayoutEffect(() => {
    try {
      document.documentElement.dataset.theme = themePreference(localStorage.getItem(THEME_KEY));
    } catch {
      /* Storage blocked: the OS theme applies. */
    }
  }, []);

  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full">
        <ErrorScreen error={props.error} retry={tryAgain(props)} fullReloadHome />
      </body>
    </html>
  );
}
