"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { LocalPlanRepository } from "@/features/plans/localRepository";
import { PlanEditor } from "@/features/plan-editor/PlanEditor";
import type { TranscriptResult } from "./parse";
/** Written by Michael's Codex. Review matches before any autosave replacement. */
export function TranscriptImport() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<TranscriptResult | null>(null);
  const [opened, setOpened] = useState(false);
  const [pending, setPending] = useState(false);
  const [existing, setExisting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    void Promise.resolve()
      .then(() => new LocalPlanRepository(window.localStorage).get("autosave"))
      .then((plan) => setExisting(Boolean(plan)))
      .catch(() => setExisting(true));
  }, []);
  async function upload(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    setError("");
    setResult(null);
    setPending(true);
    setConfirmed(false);
    try {
      if (file.size > 5 * 1024 * 1024)
        throw new Error("Choose a PDF smaller than 5 MB.");
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/transcript", { method: "POST", body });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Transcript import failed.");
      setResult(data as TranscriptResult);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "The transcript could not be imported.",
      );
    } finally {
      setPending(false);
    }
  }
  if (opened && result) return <PlanEditor initialPlan={result.plan} />;
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/plans" className="text-accent underline">
        My Plans
      </Link>
      <h1 className="mt-8 text-title font-semibold">
        Start with the courses you’ve taken.
      </h1>
      <p className="mt-4 leading-relaxed text-text-secondary">
        Upload your UMN unofficial transcript PDF. We’ll match courses to the
        Twin Cities catalog and lock the imported courses in place.
      </p>
      <p className="mt-3 text-sm text-text-secondary">
        The PDF is processed on our server in memory and discarded. Names,
        student IDs, grades and GPA are not included in the plan. Use a PDF with
        selectable text, up to 5 MB.
      </p>
      <form
        onSubmit={upload}
        className="my-8 space-y-4 rounded-card border border-border-strong bg-surface p-6"
      >
        <label className="block font-medium" htmlFor="transcript">
          Unofficial transcript PDF
        </label>
        <input
          id="transcript"
          type="file"
          accept="application/pdf,.pdf"
          required
          disabled={pending}
          className="block w-full text-sm file:mr-4 file:rounded-row file:border-0 file:bg-accent-soft file:px-4 file:py-2 file:text-accent"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setResult(null);
          }}
        />
        <button
          disabled={!file || pending}
          className="rounded-row bg-accent px-4 py-2 text-surface disabled:opacity-50"
        >
          {pending ? "Reading transcript…" : "Find my courses"}
        </button>
      </form>
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      {pending && (
        <p role="status">Reading the PDF and matching course codes…</p>
      )}
      {result && (
        <section aria-label="Import review" className="space-y-4">
          <h2 className="text-xl font-semibold">
            {result.matched} course entries matched
          </h2>
          <p>
            Review your imported courses in the plan before relying on it. The
            catalog covers courses through Fall 2024; transfer credit and
            unmatched courses require manual review.
          </p>
          {result.unmatched.length > 0 && (
            <div>
              <h3 className="font-semibold">Unmatched course codes</h3>
              <p className="mt-2 text-text-secondary">
                {result.unmatched.join(", ")}
              </p>
            </div>
          )}
          {existing && (
            <label className="flex items-start gap-3 rounded-row bg-warning-soft p-4">
              <input
                type="checkbox"
                className="mt-1"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              <span>
                Replace the existing browser autosave with this imported plan.
                Cloud plans are kept.
              </span>
            </label>
          )}
          <div className="flex gap-5">
            <button
              disabled={existing && !confirmed}
              onClick={() => setOpened(true)}
              className="rounded-row bg-accent px-4 py-2 text-surface disabled:opacity-50"
            >
              Open imported plan
            </button>
            <Link href="/plan/autosave" className="py-2 text-accent underline">
              Keep existing autosave
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
