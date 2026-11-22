"use client";

import { ErrorScreen, tryAgain, type ErrorPageProps } from "@/features/errors/ErrorScreen";

/** L6 (Hadi's Claude, 2026-11-22): the app-wide error boundary (inside the root layout, so themed). */
export default function Error(props: ErrorPageProps) {
  return <ErrorScreen error={props.error} retry={tryAgain(props)} />;
}
