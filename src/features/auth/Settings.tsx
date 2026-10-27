"use client";
import { useState, type FormEvent } from "react";
import { ThemeSettings } from "@/features/theme/ThemeSettings";
import { DisplaySettingsForm } from "@/features/plan-editor/DisplaySettingsForm";
import { browserSupabase } from "./client";
import { useRouter } from "next/navigation";
/** Written by Michael's Codex. Deletion requires server reauthentication. */
export function Settings({ email }: { email: string | undefined }) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function remove(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/auth/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation, password }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Account could not be deleted.");
      await browserSupabase().auth.signOut({ scope: "local" });
      router.replace("/");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Account could not be deleted.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="space-y-6">
      <ThemeSettings />
      <section>
        <h3 className="mb-3 font-semibold">Display preferences</h3>
        <DisplaySettingsForm />
      </section>
      {email && (
        <section className="border-t border-border pt-5">
          <h3 className="font-semibold text-danger">Delete account</h3>
          <p className="my-2 text-sm text-text-secondary">
            Permanently delete {email} and all plans owned by this account. This
            cannot be undone.
          </p>
          <form onSubmit={remove} className="space-y-3">
            <label className="block text-sm">
              Current password
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-row border border-border-strong p-2"
              />
            </label>
            <label className="block text-sm">
              Type “Delete all my data”
              <input
                required
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                className="mt-1 w-full rounded-row border border-border-strong p-2"
              />
            </label>
            {error && (
              <p role="alert" className="text-danger">
                {error}
              </p>
            )}
            <button
              disabled={
                pending || confirmation !== "Delete all my data" || !password
              }
              className="rounded-row bg-danger px-3 py-2 text-surface disabled:opacity-50"
            >
              {pending ? "Deleting…" : "Delete my account and plans"}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
