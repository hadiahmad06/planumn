"use client";
import Link from "next/link";
import { useAuth } from "@/features/auth/useAuth";
/** Written by Michael's Codex. Guest planning stays available while auth loads. */
export function LandingActions() {
  const { user } = useAuth();
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Link
        href={user ? "/plans" : "/plan/new"}
        className="rounded-full bg-accent px-6 py-3 font-medium text-surface hover:bg-accent-hover"
      >
        {user ? "Open My Plans" : "Start a plan"}
      </Link>
      <Link
        href="/plan/import"
        className="rounded-full border border-border-strong bg-surface px-6 py-3 font-medium hover:border-accent"
      >
        Import a transcript
      </Link>
      <Link
        href="/plan/autosave"
        className="text-sm text-accent underline underline-offset-4"
      >
        Resume browser autosave
      </Link>
    </div>
  );
}
