"use client";

import Link from "next/link";
import { useMemo } from "react";
import { programName } from "@/features/requirements/programOptions";
import { ApasPlanStep } from "./ApasPlanStep";
import { captureChecks, downloadReport } from "./capture";
import { useImportedAudit, type ImportedAudit } from "./importedAudit";
import { useApasImport } from "./useApasImport";
import { ParsedAudit } from "./ParsedAudit";

const kb = (s: string) => `${Math.max(1, Math.round(new Blob([s]).size / 1024))} KB`;

/**
 * /plan/apas: import from APAS through the browser extension (B1 step 1). Written by Ishaan's Claude.
 * B1 multi-audit (Hadi's Claude): several reports, one per program, merge into one plan.
 */
export function ApasImport() {
  const { state, start, discard } = useApasImport();
  const held = useImportedAudit((s) => s.audits);
  const audits = useMemo(() => held.map((h) => h.audit), [held]);

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

        {state.phase === "ready" &&
          (held.length === 0 ? (
            <button type="button" onClick={start} className="rounded-row bg-accent px-4 py-2 font-medium text-surface hover:bg-accent-hover">
              Import from APAS
            </button>
          ) : (
            <MoreReports onAdd={start} onDiscard={discard} count={held.length} />
          ))}

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
              {state.report.capturedAt && ` · ${new Date(state.report.capturedAt).toLocaleString()}`}. Nothing has been
              saved or uploaded.
            </p>
            <CaptureSummary html={state.report.html} />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => downloadReport(state.report)}
                className="rounded-row bg-accent px-4 py-2 font-medium text-surface hover:bg-accent-hover"
              >
                Save a copy (.html)
              </button>
              {held.length > 0 && (
                <button type="button" onClick={start} className="rounded-row border border-border-strong px-4 py-2">
                  Add another report
                </button>
              )}
              <button type="button" onClick={discard} className="rounded-row border border-border-strong px-4 py-2">
                {held.length > 1 ? "Discard reports" : "Discard report"}
              </button>
            </div>
            <p className="text-sm text-text-secondary">
              The copy goes to your Downloads folder only. It contains your academic record, so keep it private.
            </p>
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
      {held.length > 0 && state.phase !== "waiting" && (
        <>
          <HeldReports held={held} />
          <ApasPlanStep audits={audits} />
        </>
      )}
    </main>
  );
}

const ADD_HINT =
  "For a minor or second major, add that program's report: in the planu.mn bar on APAS, choose “I'll pick a report”, open that program's audit and send it. A report for a program already here replaces the older one.";

/** "Add another report" / "Discard reports", when reports are already held (B1 multi-audit). */
function MoreReports({ onAdd, onDiscard, count }: { onAdd: () => void; onDiscard: () => void; count: number }) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onAdd} className="rounded-row bg-accent px-4 py-2 font-medium text-surface hover:bg-accent-hover">
          Add another report
        </button>
        <button type="button" onClick={onDiscard} className="rounded-row border border-border-strong px-4 py-2">
          {count > 1 ? "Discard reports" : "Discard report"}
        </button>
      </div>
    </div>
  );
}

/** The reports held in this tab, one per program (B1 multi-audit). */
export function HeldReports({ held }: { held: readonly ImportedAudit[] }) {
  return (
    <section
      className="my-8 space-y-3 rounded-card border border-border-strong bg-surface p-6"
      aria-label="Reports in this tab"
    >
      <h2 className="text-lg font-semibold">
        {held.length === 1 ? "1 report" : `${held.length} reports`} in this tab
      </h2>
      <ul className="space-y-1 text-sm">
        {held.map(({ key, programId, audit }) => (
          <li key={key}>
            {audit.program.title} ({audit.program.code})
            {audit.preparedOn && <span className="text-text-secondary"> · prepared {audit.preparedOn}</span>}
            <span className="text-text-secondary">
              {" "}
              · {programId ? `planu.mn program: ${programName(programId)}` : "no matching planu.mn program"}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-sm text-text-secondary">{ADD_HINT}</p>
    </section>
  );
}

/** Quick signals that the capture holds the report (B1, Hadi's Claude). Not a parse. */
function CaptureSummary({ html }: { html: string }) {
  const c = captureChecks(html);
  return (
    <ul className="space-y-1 text-sm">
      <li className={c.courseCodes > 0 ? "text-text-secondary" : "text-danger"}>
        {c.courseCodes > 0
          ? `${c.courseCodes} course codes found (e.g. "CSCI 2041" counted once).`
          : "No course codes found. This may not be an audit report: open the report itself and send again."}
      </li>
      {c.frames > 0 && (
        <li className="text-danger">
          This page has {c.frames} embedded frame{c.frames === 1 ? "" : "s"}, whose content isn&apos;t captured. Part of the
          report may be missing.
        </li>
      )}
    </ul>
  );
}
