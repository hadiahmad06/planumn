"use client";

import { useState } from "react";

/** The message the error check throws (the e2e suite looks for it in the report). */
export const ERROR_CHECK_MESSAGE = "planu.mn error check: test error thrown by a client component";

/** L6 (Hadi's Claude, 2026-11-22): see `src/app/info/error-check/page.tsx`. */
export function ErrorCheck() {
  const [broken, setBroken] = useState(false);
  if (broken) throw new Error(ERROR_CHECK_MESSAGE);
  return (
    <main className="mx-auto max-w-md px-4 py-12 text-text-primary">
      <h1 className="text-2xl font-semibold">Error check</h1>
      <p className="mt-3 text-text-secondary">
        This button throws an error inside a client component, to check the error page and the server log.
      </p>
      <button
        type="button"
        onClick={() => setBroken(true)}
        className="mt-6 rounded-row bg-accent px-4 py-2.5 font-medium text-surface hover:bg-accent-hover"
      >
        Throw a test error
      </button>
    </main>
  );
}
