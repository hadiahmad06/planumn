"use client";

import Link from "next/link";
import { useState } from "react";
import { ERROR_CHECK_MESSAGE } from "./checks";

/**
 * L6 (Hadi's Claude, 2026-11-22): see `src/app/info/error-check/page.tsx`. `other` links to the other
 * check page with a client-side navigation (same document), so two crashes in one tab can be checked.
 */
export function ErrorCheck({ other }: { other: "/info/error-check" | "/plan/error-check" }) {
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
      <p className="mt-6">
        <Link href={other} className="text-text-secondary underline hover:text-text-primary">
          Open the other error check ({other})
        </Link>
      </p>
    </main>
  );
}
