"use client";

import { ErrorScreen } from "@/features/errors/ErrorScreen";

/** L6 (Hadi's Claude, 2026-11-22): the app-wide error boundary (inside the root layout, so themed). */
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorScreen error={error} retry={retry} />;
}
