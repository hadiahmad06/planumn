"use client";

import Link from "next/link";
import { useApasImport } from "./useApasImport";
import { ParsedAudit } from "./ParsedAudit";

const kb = (s: string) => `${Math.max(1, Math.round(new Blob([s]).size / 1024))} KB`;

/** /plan/apas: import from APAS through the browser extension (B1 step 1). Written by Ishaan's Claude. */
export function ApasImport() {
  const { state, start, discard } = useApasImport();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/plans" className="text-accent underline">
        My Plans
      </Link>
      <h1 className="mt-8 text-title font-semibold">Import from APAS</h1>
      <p className="mt-4 leading-relaxed text-text-secondary">
        The planu.mn extension opens APAS in a new tab. You sign in to UMN there yourself, so planu.mn never sees your
        password or Duo. Open the report you want and click <strong>Send this report to planu.mn</strong>.
      </p>
      <p className="mt-3 text-sm text-text-secondary">
        The report stays in this browser tab only. It isn&apos;t saved or uploaded, and it&apos;s gone when you close
        the tab.
      </p>

      <section className="my-8 space-y-4 rounded-card border border-border-strong bg-surface p-6" aria-live="polite">
        {state.phase === "checking" && <p className="text-text-secondary">Looking for the planu.mn extension…</p>}

        {state.phase === "missing" && (
          <p>
            The planu.mn APAS extension isn&apos;t installed or doesn&apos;t have access yet. Install it, allow access
            from its toolbar button, then reload this page.
          </p>
        )}

        {state.phase === "ready" && (
          <button type="button" onClick={start} className="rounded-row bg-accent px-4 py-2 font-medium text-surface hover:bg-accent-hover">
            Import from APAS
          </button>
        )}

        {state.phase === "waiting" && (
          <p>
            APAS is open in another tab. Sign in, open your report, and click <strong>Send</strong> in the planu.mn bar
            at the bottom of the page.
          </p>
        )}

        {state.phase === "received" && (
          <div className="space-y-3">
            <p className="font-medium">Report received ({kb(state.report.html)}).</p>
            <p className="text-sm text-text-secondary">
              From {state.report.title || "APAS"}
              {state.report.capturedAt && ` · ${new Date(state.report.capturedAt).toLocaleString()}`}. Turning it into a
              plan is coming next. Nothing has been saved or uploaded.
            </p>
            <button type="button" onClick={discard} className="rounded-row border border-border-strong px-4 py-2">
              Discard report
            </button>
          </div>
        )}

        {state.phase === "error" && (
          <div className="space-y-3">
            <p className="text-danger">{state.message}</p>
            <button type="button" onClick={start} className="rounded-row bg-accent px-4 py-2 font-medium text-surface hover:bg-accent-hover">
              Try again
            </button>
          </div>
        )}
      </section>
      {state.phase === "received" && <ParsedAudit html={state.report.html} />}
    </main>
  );
}
