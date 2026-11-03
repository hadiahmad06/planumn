"use client";
import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { plannedCourseIds } from "@/domain/plan";
import { usePlanStore } from "@/features/plan-editor/store";
import {
  compareCatalog,
  readHistory,
  rememberCatalog,
  HISTORY_KEY,
  type CatalogCheck,
  type CatalogHistory,
} from "./history";

type Result = { check: CatalogCheck; history: CatalogHistory };
/** Written by Michael's Codex. Manual observations and explicit reference acknowledgement; no plan writes. */
export function CatalogUpdates() {
  const [open, setOpen] = useState(false),
    [pending, setPending] = useState(false),
    [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null),
    [remembered, setRemembered] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function check() {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setOpen(true);
    setPending(true);
    setError("");
    setResult(null);
    setRemembered(false);
    try {
      const plan = usePlanStore.getState().plan;
      if (!plan)
        throw new Error("Open a plan before checking its catalog data.");
      const courseIds = plannedCourseIds(plan),
        programIds = [...new Set(plan.programs)];
      if (!courseIds.length && !programIds.length)
        throw new Error("Add courses or programs to check their catalog data.");
      const history = readHistory(localStorage.getItem(HISTORY_KEY));
      const count = Math.max(
        Math.ceil(courseIds.length / 200),
        Math.ceil(programIds.length / 5),
      );
      const combined: CatalogCheck = {
        items: [],
        unavailable: [],
        checkedAt: new Date().toISOString(),
      };
      for (let i = 0; i < count; i++) {
        const response = await fetch("/api/catalog-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseIds: courseIds.slice(i * 200, (i + 1) * 200),
            programIds: programIds.slice(i * 5, (i + 1) * 5),
          }),
          signal: abort.signal,
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            data.error || "Catalog data could not be checked. Try again.",
          );
        const batch = data as CatalogCheck;
        combined.items.push(...batch.items);
        combined.unavailable.push(...batch.unavailable);
        combined.checkedAt = batch.checkedAt;
      }
      if (!abort.signal.aborted) setResult({ check: combined, history });
    } catch (e) {
      if (!abort.signal.aborted)
        setError(
          e instanceof Error
            ? e.message
            : "Catalog check failed. Browser storage may be unavailable.",
        );
    } finally {
      if (controller.current === abort) setPending(false);
    }
  }
  function remember() {
    if (!result) return;
    try {
      localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(
          rememberCatalog(
            readHistory(localStorage.getItem(HISTORY_KEY)),
            result.check,
          ),
        ),
      );
      setRemembered(true);
      setError("");
    } catch {
      setError(
        "This browser could not remember the check. Your previous reference has been kept; free browser storage and try again.",
      );
    }
  }
  const comparison = result
    ? compareCatalog(result.history, result.check)
    : null;
  return (
    <>
      <button
        type="button"
        onClick={() => void check()}
        className="rounded-row border border-border-strong bg-surface px-2.5 py-1 text-xs text-text-secondary hover:border-accent hover:text-accent"
      >
        Catalog updates
      </button>
      <Modal
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            controller.current?.abort();
            setPending(false);
          }
        }}
        title="Catalog updates & APAS"
        description="Compare public catalog data with your last remembered check in this browser. Verify differences against APAS for your catalog year; public responses may be cached."
      >
        <p className="mb-4 text-sm">
          Re-sync your APAS each term, especially after changing programs or
          courses.
        </p>
        {/* Full navigation loads the APAS extension bridge on /plan/* (the existing APAS integration contract). */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- the extension requires a document load */}
        <a
          href="/plan/apas"
          className="mb-5 inline-block text-sm text-accent underline"
        >
          Open APAS import
        </a>
        {pending && (
          <p role="status" className="text-sm">
            Checking public course and program data…
          </p>
        )}
        {error && (
          <p role="alert" className="mb-4 text-sm text-danger">
            {error}
          </p>
        )}
        {result && comparison && (
          <div className="space-y-4 text-sm">
            <p>
              {result.check.items.length} catalog items checked ·{" "}
              {comparison.firstSeen} without a previous reference ·{" "}
              {result.check.unavailable.length} could not be checked.
            </p>
            {comparison.changed.length ? (
              <>
                <h3 className="font-semibold">
                  Differences since your last remembered check
                </h3>
                <ul className="space-y-3">
                  {comparison.changed.map(({ before, after, lastChecked }) => (
                    <li
                      key={after.key}
                      className="rounded-row border border-border p-3"
                    >
                      <h4 className="font-medium">{after.label}</h4>
                      <p className="mt-1 text-xs text-text-secondary">
                        Previous check:{" "}
                        {new Date(lastChecked).toLocaleDateString()}
                      </p>
                      {before.summary !== after.summary ? (
                        <>
                          <p className="mt-2 break-words text-xs">
                            Before: {before.summary}
                          </p>
                          <p className="mt-1 break-words text-xs">
                            Now: {after.summary}
                          </p>
                        </>
                      ) : (
                        <p className="mt-2 text-xs">
                          Program catalog data or requirement wording/options
                          differ. Review the current catalog and APAS.
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p>
                {result.check.items.length === 0
                  ? "No comparable catalog data was returned."
                  : comparison.firstSeen === result.check.items.length
                    ? "This is the first reference for these items in this browser."
                    : "No differences were detected for items with a remembered reference."}
              </p>
            )}
            {result.check.unavailable.length > 0 && (
              <p className="break-words text-text-secondary">
                Could not check: {result.check.unavailable.join(", ")}. Missing
                data does not establish that a course or program was removed;
                its previous reference is kept.
              </p>
            )}
            <button
              type="button"
              disabled={remembered || !result.check.items.length}
              onClick={remember}
              className="rounded-row bg-accent px-4 py-2 text-surface disabled:opacity-50"
            >
              {remembered ? "Reference remembered" : "Remember these versions"}
            </button>
            {remembered && (
              <p role="status">This check is remembered in this browser.</p>
            )}
          </div>
        )}
        {!pending && (
          <button
            type="button"
            onClick={() => void check()}
            className="mt-4 block text-sm text-accent underline"
          >
            Check again
          </button>
        )}
        <details className="mt-5 text-xs text-text-secondary">
          <summary className="cursor-pointer">About check history</summary>
          <p className="mt-2">
            References contain public catalog metadata, not account details or
            an APAS report. They stay in this browser and older entries may be
            evicted. Clearing browser data loses them. Title, version, rule
            wording or ordering changes can trigger a difference; this does not
            establish which rules apply to your admit year.
          </p>
          <button
            type="button"
            className="mt-2 underline"
            onClick={() => {
              try {
                controller.current?.abort();
                setPending(false);
                localStorage.removeItem(HISTORY_KEY);
                setResult(null);
                setRemembered(false);
                setError("");
              } catch {
                setError("This browser could not reset catalog check history.");
              }
            }}
          >
            Reset catalog check history
          </button>
        </details>
      </Modal>
    </>
  );
}
