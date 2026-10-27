"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Plan } from "@/domain/plan";
import { plannedCourseIds } from "@/domain/plan";
import { termLabel } from "@/domain/terms";
import { courseCode, formatCredits } from "@/domain/course";
import { useAuth } from "@/features/auth/useAuth";
import { UserMenu } from "@/features/auth/UserMenu";
import { fetchCourses, useCourseCache } from "@/features/catalog/courseCache";
import { programName } from "@/features/requirements/programOptions";
import { CloudPlanRepository } from "./clientRepository";
import {
  comparePlans,
  duplicatePlan,
  type ComparedCourse,
  type CourseDifference,
} from "./compare";
const repo = new CloudPlanRepository();
const DIFFERENCE: Record<CourseDifference, string> = {
  same: "Same course and lock",
  "lock-changed": "Different lock state",
  "different-term": "Also in another term of the other plan",
  "only-here": "Extra entry in this term",
};

/** Written by Michael's Codex. Compare owned snapshots without mounting the editor or autosaving either input. */
export function PlanComparison() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<{
    owner?: string;
    plans?: Plan[];
    error?: string;
  }>({});
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState<[string, string]>(["", ""]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [catalogError, setCatalogError] = useState(false);
  const courses = useCourseCache((s) => s.courses);
  useEffect(() => {
    if (!user) return;
    let active = true;
    repo.list().then(
      (rows) => {
        if (!active) return;
        const plans = rows.filter(
          (plan) => plan.id && !plan.deletion_scheduled_at,
        );
        setState({ owner: user.id, plans });
        setSelected([plans[0]?.id ?? "", plans[1]?.id ?? plans[0]?.id ?? ""]);
      },
      (e) => {
        if (active)
          setState({
            owner: user.id,
            error:
              e instanceof Error
                ? e.message
                : "Your plans could not be loaded.",
          });
      },
    );
    return () => {
      active = false;
    };
  }, [user, attempt]);
  const current = user && state.owner === user.id ? state : {};
  const left = current.plans?.find((plan) => plan.id === selected[0]);
  const right = current.plans?.find((plan) => plan.id === selected[1]);
  const ids = [
    ...new Set([
      ...(left ? plannedCourseIds(left) : []),
      ...(right ? plannedCourseIds(right) : []),
    ]),
  ].join(",");
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
  async function duplicate(plan: Plan) {
    if (busy) return;
    setBusy(plan.id);
    setError("");
    try {
      const saved = await repo.save(duplicatePlan(plan));
      if (!saved.id)
        throw new Error(
          "The copy could not be opened. Check My Plans before retrying.",
        );
      router.push(`/plan/${encodeURIComponent(saved.id)}`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Your copy could not be saved.",
      );
      setBusy(null);
    }
  }
  function list(entries: ComparedCourse[], present: boolean) {
    return entries.length ? (
      <ul className="space-y-3">
        {entries.map(({ course: entry, difference }, index) => {
          const course = courses[entry.id];
          return (
            <li
              key={`${entry.id}-${index}`}
              className="rounded-row border border-border p-3 text-sm"
            >
              <p className="font-medium">
                {course ? courseCode(course) : `Course ID ${entry.id}`} ·{" "}
                {entry.lock}
              </p>
              <p className="mt-1 break-words text-xs text-text-secondary">
                {course
                  ? `${course.title} · ${formatCredits(course.credits)} cr`
                  : "Catalog details unavailable or loading"}
              </p>
              <p
                className={`mt-2 text-xs ${difference === "same" ? "text-text-secondary" : "font-medium text-accent"}`}
              >
                {DIFFERENCE[difference]}
              </p>
            </li>
          );
        })}
      </ul>
    ) : (
      <p className="text-sm text-text-tertiary">
        {present ? "No entries in this term" : "Term is not in this plan"}
      </p>
    );
  }
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <nav className="mb-10 flex items-center justify-between">
        <Link href="/plans" className="text-accent underline">
          My Plans
        </Link>
        <UserMenu />
      </nav>
      <h1 className="text-title font-semibold">Compare plans</h1>
      <p className="mt-3 max-w-2xl text-text-secondary">
        Explore two saved plans side by side. Comparing does not change either
        plan. Duplicate a plan to try a new path in its own copy.
      </p>
      {loading ? (
        <p role="status" className="mt-6">
          Checking your account…
        </p>
      ) : !user ? (
        <p className="mt-6">
          <Link
            href="/auth?next=%2Fplans%2Fcompare"
            className="text-accent underline"
          >
            Sign in
          </Link>{" "}
          to compare your saved plans.
        </p>
      ) : current.error ? (
        <p role="alert" className="mt-6 text-danger">
          {current.error}{" "}
          <button
            type="button"
            className="underline"
            onClick={() => setAttempt((n) => n + 1)}
          >
            Retry
          </button>
        </p>
      ) : !current.plans ? (
        <p role="status" className="mt-6">
          Loading your plans…
        </p>
      ) : !current.plans.length ? (
        <p className="mt-6">
          You have no active saved plans.{" "}
          <Link href="/plan/new" className="text-accent underline">
            Create a plan
          </Link>{" "}
          to begin.
        </p>
      ) : (
        <>
          <div className="my-7 grid gap-4 md:grid-cols-2">
            {([0, 1] as const).map((side) => {
              const plan = side === 0 ? left : right;
              return (
                <section
                  key={side}
                  className="min-w-0 space-y-3 rounded-card border border-border-strong bg-surface p-4"
                >
                  <label
                    className="block text-sm font-medium"
                    htmlFor={`compare-${side}`}
                  >
                    {side === 0 ? "Left plan" : "Right plan"}
                  </label>
                  <select
                    id={`compare-${side}`}
                    value={selected[side]}
                    onChange={(e) =>
                      setSelected((current) =>
                        side === 0
                          ? [e.target.value, current[1]]
                          : [current[0], e.target.value],
                      )
                    }
                    className="w-full rounded-row border border-border-strong bg-surface p-2"
                  >
                    {current.plans!.map((p) => (
                      <option key={p.id} value={p.id!}>
                        {p.title || "Untitled plan"}
                      </option>
                    ))}
                  </select>
                  {plan && (
                    <>
                      <p className="text-sm text-text-secondary">
                        {plan.semesters.reduce(
                          (n, s) => n + s.courses.length,
                          0,
                        )}{" "}
                        course entries ·{" "}
                        {plan.programs.length
                          ? plan.programs.map(programName).join("; ")
                          : "No programs selected"}
                      </p>
                      <button
                        type="button"
                        disabled={Boolean(busy)}
                        onClick={() => void duplicate(plan)}
                        className="rounded-row border border-border-strong px-3 py-1.5 text-sm hover:bg-sunken disabled:opacity-50"
                      >
                        {busy === plan.id
                          ? "Saving copy…"
                          : "Duplicate this plan"}
                      </button>
                    </>
                  )}
                </section>
              );
            })}
          </div>
          {error && (
            <p role="alert" className="my-4 text-danger">
              {error}
            </p>
          )}
          {catalogError && (
            <p role="alert" className="my-4 text-sm text-danger">
              Some catalog details could not load.{" "}
              <button
                type="button"
                className="underline"
                onClick={() => {
                  setCatalogError(false);
                  void fetchCourses(
                    ids.split(",").filter(Boolean).map(Number),
                  ).catch(() => setCatalogError(true));
                }}
              >
                Retry catalog
              </button>
            </p>
          )}
          {left && right && (
            <div className="space-y-5">
              {comparePlans(left, right).map((term) => (
                <section
                  key={term.index}
                  className="rounded-card border border-border bg-surface p-4"
                >
                  <h2 className="mb-4 font-semibold">
                    {termLabel(term.index)}
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="mb-2 text-xs font-medium text-text-secondary">
                        Left: {left.title || "Untitled plan"}
                      </h3>
                      {list(term.left, term.leftPresent)}
                    </div>
                    <div>
                      <h3 className="mb-2 text-xs font-medium text-text-secondary">
                        Right: {right.title || "Untitled plan"}
                      </h3>
                      {list(term.right, term.rightPresent)}
                    </div>
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
