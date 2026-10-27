"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { plannedCourseIds, SEMESTER_KINDS, type Plan } from "@/domain/plan";
import { termLabel } from "@/domain/terms";
import { courseCode, formatCredits } from "@/domain/course";
import { useAuth } from "@/features/auth/useAuth";
import { fetchCourses, useCourseCache } from "@/features/catalog/courseCache";
import { programName } from "@/features/requirements/programOptions";
import { CloudPlanRepository } from "@/features/plans/clientRepository";
import {
  AUTOSAVE_KEY,
  LocalPlanRepository,
} from "@/features/plans/localRepository";
import { copySnapshot, decodeSnapshot } from "./snapshot";

/** Written by Michael's Codex. Read-only view; no editor, store replacement or saving until Copy. */
export function SharedPlan() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [snapshot, setSnapshot] = useState<{ plan?: Plan; error?: string }>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [catalogError, setCatalogError] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const courses = useCourseCache((state) => state.courses);
  useEffect(() => {
    let active = true;
    function read() {
      if (!active) return;
      setConfirm(false);
      setConfirmed(false);
      setError("");
      try {
        setSnapshot({ plan: decodeSnapshot(window.location.hash.slice(1)) });
      } catch (e) {
        setSnapshot({
          error:
            e instanceof Error
              ? e.message
              : "This snapshot could not be opened.",
        });
      }
    }
    void Promise.resolve().then(read);
    window.addEventListener("hashchange", read);
    return () => {
      active = false;
      window.removeEventListener("hashchange", read);
    };
  }, []);
  const plan = snapshot.plan;
  const ids = plan ? plannedCourseIds(plan).join(",") : "";
  useEffect(() => {
    let active = true;
    if (ids)
      void fetchCourses(ids.split(",").map(Number)).catch(() => {
        if (active) setCatalogError(true);
      });
    return () => {
      active = false;
    };
  }, [ids]);
  async function copy() {
    if (!plan || loading || busy) return;
    setError("");
    try {
      if (
        !user &&
        !confirmed &&
        (localStorage.getItem(AUTOSAVE_KEY) || localStorage.getItem("plan"))
      ) {
        setConfirm(true);
        return;
      }
      setBusy(true);
      const draft = copySnapshot(plan);
      const saved = await (
        user ? new CloudPlanRepository() : new LocalPlanRepository(localStorage)
      ).save(draft);
      router.push(
        user && saved.id
          ? `/plan/${encodeURIComponent(saved.id)}`
          : "/plan/autosave",
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Your copy could not be saved. Try again.",
      );
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <nav className="mb-10 flex gap-6">
        <Link href="/" className="text-xl font-semibold text-accent">
          planu.mn
        </Link>
        <Link href="/plans" className="text-accent underline">
          My Plans
        </Link>
      </nav>
      {snapshot.error ? (
        <section className="max-w-xl space-y-4">
          <h1 className="text-title font-semibold">Snapshot unavailable</h1>
          <p role="alert">{snapshot.error}</p>
          <p>
            The complete link must include everything after the # character.
          </p>
        </section>
      ) : !plan ? (
        <p role="status">Opening shared snapshot…</p>
      ) : (
        <>
          <p className="mb-2 text-sm font-medium text-accent">
            Read-only plan snapshot
          </p>
          <h1 className="break-words text-title font-semibold">
            {plan.title || "Untitled plan"}
          </h1>
          <p className="mt-3 max-w-2xl text-text-secondary">
            This is a snapshot carried in the link. It does not update when the
            sender edits their plan. Copy it to make your own changes.
          </p>
          {!!plan.programs.length && (
            <p className="mt-3 break-words text-sm">
              Programs: {plan.programs.map(programName).join(" · ")}
            </p>
          )}
          <section
            aria-label="Copy shared plan"
            className="my-7 max-w-2xl space-y-3 rounded-card border border-border-strong bg-surface p-5"
          >
            <button
              type="button"
              disabled={loading || busy || (confirm && !confirmed)}
              onClick={() => void copy()}
              className="rounded-row bg-accent px-4 py-2 text-surface disabled:opacity-50"
            >
              {busy
                ? "Saving your copy…"
                : loading
                  ? "Checking your account…"
                  : user
                    ? "Copy to My Plans"
                    : "Copy to browser autosave"}
            </button>
            {!loading && !user && (
              <p className="text-sm text-text-secondary">
                Or{" "}
                <Link
                  href="/auth"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent underline"
                >
                  sign in in another tab
                </Link>{" "}
                to save a new copy to My Plans, then return here.
              </p>
            )}
            {confirm && !user && (
              <label className="flex items-start gap-3 rounded-row bg-warning-soft p-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                <span>
                  Replace this browser’s existing autosave with a copy of the
                  shared snapshot. Cloud plans are kept.
                </span>
              </label>
            )}
            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
          </section>
          {catalogError && (
            <p role="alert" className="mb-5 text-sm text-danger">
              Some catalog details could not load. Course IDs are preserved in
              the snapshot.{" "}
              <button
                type="button"
                className="underline"
                onClick={() => {
                  setCatalogError(false);
                  void fetchCourses(plannedCourseIds(plan)).catch(() =>
                    setCatalogError(true),
                  );
                }}
              >
                Retry catalog
              </button>
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-3">
            {[...plan.semesters]
              .sort((a, b) => Number(a.index) - Number(b.index))
              .map((semester) => (
                <section
                  key={semester.index}
                  className="min-w-0 rounded-card border border-border bg-surface p-4"
                >
                  <h2 className="mb-3 font-semibold">
                    {termLabel(semester.index)}
                    {/* B19 (Ishaan's Claude): special-semester label carried in the link. */}
                    {semester.kind &&
                      ` · ${SEMESTER_KINDS.find((k) => k.kind === semester.kind)?.label ?? ""}`}
                  </h2>
                  {semester.courses.length || semester.placeholders?.length ? (
                    <ul className="space-y-3">
                      {semester.courses.map((entry, index) => {
                        const course = courses[entry.id];
                        return (
                          <li key={`${entry.id}-${index}`} className="text-sm">
                            <p className="font-medium">
                              {course
                                ? courseCode(course)
                                : `Course ID ${entry.id}`}
                              {entry.lock === "locked" && " · Locked"}
                            </p>
                            <p className="break-words text-text-secondary">
                              {course
                                ? `${course.title} · ${formatCredits(course.credits)} cr`
                                : "Catalog details unavailable or loading"}
                            </p>
                          </li>
                        );
                      })}
                      {/* B2 (Ishaan's Claude): placeholder slots carried in the link. */}
                      {semester.placeholders?.map((slot) => (
                        <li key={slot.key} className="text-sm">
                          <p className="font-medium">{slot.label}</p>
                          <p className="text-text-secondary">
                            Placeholder · {slot.credits} cr
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-text-tertiary">
                      No courses planned
                    </p>
                  )}
                </section>
              ))}
          </div>
          <p className="mt-8 text-sm text-text-secondary">
            Planning aid, not an official degree audit. Confirm requirements and
            offerings with your advisor. Catalog data through Fall 2024.
          </p>
        </>
      )}
    </main>
  );
}
