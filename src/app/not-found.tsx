import type { Metadata } from "next";
import Link from "next/link";
import { ReloadButton } from "@/features/errors/ReloadButton";

/** L6 (Hadi's Claude, 2026-11-22): the app-wide 404 page, in the same style as the error pages. */
export const metadata: Metadata = { title: "Page not found | planu.mn", robots: { index: false } };

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-10 text-text-primary">
      <section
        aria-labelledby="not-found-title"
        className="w-full max-w-md rounded-modal border border-border bg-surface p-6 shadow-card sm:p-8"
      >
        <p className="text-micro font-medium uppercase tracking-wide text-text-secondary">404</p>
        <h1 id="not-found-title" className="mt-2 text-2xl font-semibold">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-3 text-text-secondary">
          The link may be old or mistyped. You can start or reopen a plan from the home page.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <ReloadButton className="rounded-row bg-accent px-4 py-2.5 text-center font-medium text-surface hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" />
          <Link
            href="/"
            className="rounded-row border border-border-strong px-4 py-2.5 text-center font-medium text-text-primary hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Go to the home page
          </Link>
        </div>
      </section>
    </main>
  );
}
