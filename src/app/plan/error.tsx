"use client";
import { ErrorScreen, tryAgain, type ErrorPageProps } from "@/features/errors/ErrorScreen";
/**
 * Written by Michael's Codex. L6 (Hadi's Claude, 2026-11-22, M1 on #115): renders the shared
 * `ErrorScreen`, so crashes under `/plan/*` are reported like everywhere else; Michael's Codex's copy is kept.
 */
export default function ErrorPage(props: ErrorPageProps) {
  return (
    <ErrorScreen
      error={props.error}
      retry={tryAgain(props)}
      heading="The plan could not be displayed"
      body="Your stored plan has been kept. Try loading it again, or go back to the home page."
    />
  );
}
