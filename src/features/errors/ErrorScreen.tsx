"use client";

import Link from "next/link";
import { useEffect } from "react";
import { clientErrorReport, pageReference, sendClientErrorReport, serverDigest } from "./report";

const secondary =
  "rounded-row border border-border-strong px-4 py-2.5 text-center font-medium text-text-primary hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/**
 * L6 (Hadi's Claude, 2026-11-22): the friendly page `error.tsx` and `global-error.tsx` show. It never
 * shows the error's message or stack, only a reference the student can quote (the server digest, or
 * a `c-…` reference for a client-side crash, which is reported to the server logs here).
 *
 * Reporting rule (N1 on #115): an error that carries a Next.js digest was logged on the server by
 * `onRequestError` and is **not** reported again. A client crash is reported **once per page load**
 * under one `c-…` reference; later crashes in the same page load show that same reference.
 */
export function ErrorScreen({
  error,
  retry,
  fullReloadHome = false,
  heading = "This page hit a snag",
  body = "Plans that were already saved aren’t affected. Try again, and if it keeps happening, go back to the home page and reopen your plan.",
}: {
  error: unknown;
  retry: () => void;
  heading?: string;
  body?: string;
  /** global-error: the root layout itself failed, so "home" is a full page load, not a client navigation. */
  fullReloadHome?: boolean;
}) {
  const digest = serverDigest(error);
  const reference = digest ?? pageReference();

  useEffect(() => {
    if (digest) return; // Already logged on the server by onRequestError.
    sendClientErrorReport(clientErrorReport(error, window.location.pathname, reference));
  }, [error, digest, reference]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-10 text-text-primary">
      <title>Something went wrong | planu.mn</title>
      <section
        role="alert"
        aria-labelledby="error-title"
        className="w-full max-w-md rounded-modal border border-border bg-surface p-6 shadow-card sm:p-8"
      >
        <p className="text-micro font-medium uppercase tracking-wide text-danger">Something went wrong</p>
        <h1 id="error-title" className="mt-2 text-2xl font-semibold">
          {heading}
        </h1>
        <p className="mt-3 text-text-secondary">{body}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => retry()}
            className="rounded-row bg-accent px-4 py-2.5 font-medium text-surface hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Try again
          </button>
          <PageLink href="/" fullReload={fullReloadHome} className={secondary}>
            Go to the home page
          </PageLink>
        </div>
        <p className="mt-6 text-micro text-text-secondary">
          If you{" "}
          <PageLink href="/info/contact" fullReload={fullReloadHome} className="underline hover:text-text-primary">
            contact us
          </PageLink>
          , mention reference <span className="font-mono text-text-primary">{reference}</span>.
        </p>
      </section>
    </main>
  );
}

/** A client-side `Link`, or a plain `<a>` (full page load) when the root layout itself has failed. */
function PageLink({
  href,
  fullReload,
  className,
  children,
}: {
  href: string;
  fullReload: boolean;
  className: string;
  children: React.ReactNode;
}) {
  if (fullReload)
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
