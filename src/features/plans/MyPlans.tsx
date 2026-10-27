"use client";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Plan } from "@/domain/plan";
import {
  updatePlanList,
  visiblePlanList,
  type OwnedPlanListView,
  type PlanListView,
} from "./ownerState";
import { plannedCourseIds } from "@/domain/plan";
import { useCourses } from "@/features/catalog/courseCache";
import { useAuth, useAuthStore } from "@/features/auth/useAuth";
import { UserMenu } from "@/features/auth/UserMenu";
import { Modal } from "@/components/ui/Modal";
import { SharePlanButton } from "@/features/sharing/SharePlanButton";
import { CloudPlanRepository } from "./clientRepository";

const repo = new CloudPlanRepository();
const actionClass =
  "rounded-row border border-border-strong px-3 py-1.5 text-sm hover:bg-sunken disabled:opacity-50";
function PlanRow({
  plan,
  busy,
  onSave,
  onAction,
}: {
  plan: Plan;
  busy: boolean;
  onSave: (p: Plan) => void;
  onAction: (p: Plan, action: "delete" | "recover" | "permanent") => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(plan.title);
  const courses = useCourses(plannedCourseIds(plan));
  const count = plan.semesters.reduce((n, s) => n + s.courses.length, 0);
  const credits = plan.semesters.reduce(
    (n, s) =>
      n +
      s.courses.reduce((sum, c) => sum + (courses[c.id]?.credits.min ?? 0), 0),
    0,
  );
  const creditsReady = plannedCourseIds(plan).every((id) => courses[id]);
  function rename(event: FormEvent) {
    event.preventDefault();
    onSave({ ...plan, title: title.trim() });
    setRenaming(false);
  }
  return (
    <li className="border-b border-border py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {renaming ? (
            <form onSubmit={rename} className="flex flex-wrap gap-2">
              <label className="sr-only" htmlFor={`title-${plan.id}`}>
                Plan title
              </label>
              <input
                id={`title-${plan.id}`}
                autoFocus
                maxLength={300}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-row border border-border-strong p-2"
              />
              <button disabled={busy} className={actionClass}>
                Save name
              </button>
              <button
                type="button"
                className={actionClass}
                onClick={() => setRenaming(false)}
              >
                Cancel
              </button>
            </form>
          ) : plan.deletion_scheduled_at ? (
            <h2 className="text-lg font-medium">
              {plan.title || "Untitled plan"}
            </h2>
          ) : (
            <Link
              className="text-lg font-medium text-accent hover:underline"
              href={`/plan/${plan.id}`}
            >
              {plan.title || "Untitled plan"}
            </Link>
          )}
          <p className="mt-1 text-sm text-text-secondary">
            {count} courses ·{" "}
            {creditsReady ? `${credits} minimum credits` : "Loading credits…"}
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            {plan.deletion_scheduled_at
              ? `Recovery ends ${new Date(plan.deletion_scheduled_at).toLocaleDateString()}`
              : `Updated ${new Date(plan.last_updated).toLocaleDateString()}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {plan.deletion_scheduled_at ? (
            <>
              <button
                disabled={busy}
                onClick={() => onAction(plan, "recover")}
                className={actionClass}
              >
                Recover
              </button>
              <button
                disabled={busy}
                onClick={() => onAction(plan, "permanent")}
                className={`${actionClass} text-danger`}
              >
                Delete forever
              </button>
            </>
          ) : (
            <>
              <SharePlanButton plan={plan} disabled={busy} />
              <button
                disabled={busy}
                onClick={() => {
                  setTitle(plan.title);
                  setRenaming(true);
                }}
                className={actionClass}
              >
                Rename
              </button>
              <button
                disabled={busy}
                onClick={() => onAction(plan, "delete")}
                className={actionClass}
              >
                Move to bin
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}
/** Written by Michael's Codex. Counts include repeated courses, as saved in semesters. */
export function MyPlans() {
  const { user, loading, error: authError } = useAuth();
  const owner = user?.id ?? null;
  const [state, setState] = useState<OwnedPlanListView | null>(null);
  const { plans, error, busy, confirm } = visiblePlanList(
    state,
    loading ? null : owner,
  );
  const [deleted, setDeleted] = useState(false);
  const update = useCallback(
    (patch: Partial<PlanListView>) => {
      setState((previous) =>
        updatePlanList(
          previous,
          owner,
          useAuthStore.getState().user?.id ?? null,
          patch,
        ),
      );
    },
    [owner],
  );
  const setError = (error: string) => update({ error });
  const setBusy = (busy: boolean) => update({ busy });
  const setConfirm = (confirm: PlanListView["confirm"]) => update({ confirm });
  const refresh = useCallback(async () => {
    if (!owner || useAuthStore.getState().user?.id !== owner) return;
    update({ plans: await repo.list() });
  }, [owner, update]);
  useEffect(() => {
    if (!owner) return;
    let active = true;
    repo
      .list()
      .then((rows) => {
        if (active) update({ plans: rows, error: "" });
      })
      .catch((e) => {
        if (active)
          update({
            error:
              e instanceof Error
                ? e.message
                : "Your plans could not be loaded.",
          });
      });
    return () => {
      active = false;
    };
  }, [owner, update]);
  async function perform(run: () => Promise<unknown>) {
    if (!owner || useAuthStore.getState().user?.id !== owner) return;
    setBusy(true);
    setError("");
    try {
      await run();
      await refresh();
      setConfirm(null);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "The change could not be saved.",
      );
      try {
        await refresh();
      } catch {
        /* Keep existing rows visible. */
      }
    } finally {
      setBusy(false);
    }
  }
  function action(plan: Plan, action: "delete" | "recover" | "permanent") {
    if (!plan.id) return;
    const id = plan.id;
    if (action === "permanent")
      setConfirm({
        title: `Permanently delete “${plan.title || "Untitled plan"}”?`,
        run: () => repo.hardDelete(id),
      });
    else
      void perform(() =>
        action === "delete" ? repo.softDelete(id) : repo.recover(id),
      );
  }
  const visible =
    plans?.filter((p) => Boolean(p.deletion_scheduled_at) === deleted) ?? [];
  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <nav className="mb-12 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold text-accent">
          planu.mn
        </Link>
        <UserMenu />
      </nav>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-title font-semibold">My Plans</h1>
        <div className="flex gap-4">
          <Link href="/plan/import" className="text-accent underline">
            Import transcript
          </Link>
          {/* Ishaan's Claude (#36 follow-up): a plain <a>, not <Link>. The APAS extension's bridge
              only loads on a full page load of /plan/*, which a client-side navigation skips. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- full navigation on purpose (see above) */}
          <a href="/plan/apas" className="text-accent underline">
            Import from APAS
          </a>
          <Link
            href="/plan/new"
            className="rounded-row bg-accent px-4 py-2 text-surface"
          >
            New plan
          </Link>
        </div>
      </div>
      {loading ? (
        <p role="status" className="mt-8">
          Checking your account…
        </p>
      ) : !user ? (
        <div className="mt-8 space-y-4">
          <p>
            {authError ||
              "Sign in to see your cloud plans. Your browser autosave is available without an account."}
          </p>
          <Link href="/auth" className="block text-accent underline">
            Sign in
          </Link>
          <Link href="/plan/autosave" className="block text-accent underline">
            Resume browser autosave
          </Link>
        </div>
      ) : (
        <>
          <div className="my-6 flex gap-3">
            <button
              className={actionClass}
              aria-pressed={!deleted}
              onClick={() => setDeleted(false)}
            >
              Active (
              {plans?.filter((p) => !p.deletion_scheduled_at).length ?? "…"})
            </button>
            <button
              className={actionClass}
              aria-pressed={deleted}
              onClick={() => setDeleted(true)}
            >
              Recycle bin (
              {plans?.filter((p) => p.deletion_scheduled_at).length ?? "…"})
            </button>
            {deleted && visible.length > 0 && (
              <button
                disabled={busy}
                className={`${actionClass} text-danger`}
                onClick={() =>
                  setConfirm({
                    title: "Permanently clear the recycle bin?",
                    run: async () => {
                      for (const plan of visible)
                        if (plan.id) await repo.hardDelete(plan.id);
                    },
                  })
                }
              >
                Clear deleted
              </button>
            )}
          </div>
          {error && (
            <div role="alert" className="my-4 text-danger">
              {error}{" "}
              <button
                onClick={() => void perform(refresh)}
                className="underline"
              >
                Try again
              </button>
            </div>
          )}
          {!plans && !error ? (
            <p role="status">Loading your plans…</p>
          ) : visible.length ? (
            <ul>
              {visible.map((plan) => (
                <PlanRow
                  key={plan.id}
                  plan={plan}
                  busy={busy}
                  onSave={(p) => void perform(() => repo.save(p))}
                  onAction={action}
                />
              ))}
            </ul>
          ) : (
            <p className="py-8 text-text-secondary">
              {deleted
                ? "Your recycle bin is empty. Plans moved here can be recovered for 30 days."
                : "You have no saved plans yet. Start a new plan or import your transcript."}
            </p>
          )}
        </>
      )}
      <Modal
        open={Boolean(confirm)}
        onOpenChange={(open) => {
          if (!open && !busy) setConfirm(null);
        }}
        title={confirm?.title || "Delete plans"}
        description="This removes the selected plan data permanently. It cannot be recovered."
      >
        <div className="flex gap-3">
          <button
            className={actionClass}
            disabled={busy}
            onClick={() => setConfirm(null)}
          >
            Cancel
          </button>
          <button
            disabled={busy}
            className="rounded-row bg-danger px-4 py-2 text-surface disabled:opacity-50"
            onClick={() => {
              if (confirm) void perform(confirm.run);
            }}
          >
            {busy ? "Deleting…" : "Delete forever"}
          </button>
        </div>
      </Modal>
    </main>
  );
}
