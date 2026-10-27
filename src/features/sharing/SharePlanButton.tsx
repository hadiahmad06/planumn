"use client";
import { useState } from "react";
import type { Plan } from "@/domain/plan";
import { Modal } from "@/components/ui/Modal";
import { encodeSnapshot } from "./snapshot";

/** Written by Michael's Codex. Share a detached snapshot only after an explicit action. */
export function SharePlanButton({
  plan,
  disabled = false,
}: {
  plan: Plan;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  function prepare() {
    setError("");
    setCopied(false);
    setUrl("");
    try {
      setUrl(`${window.location.origin}/share#${encodeSnapshot(plan)}`);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "The sharing link could not be prepared.",
      );
    }
    setOpen(true);
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setError("");
    } catch {
      setError("Copy was unavailable. Select and copy the link above.");
    }
  }
  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={prepare}
        className="rounded-row border border-border-strong px-3 py-1.5 text-sm hover:bg-sunken disabled:opacity-50"
      >
        Share snapshot
      </button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Share a plan snapshot"
        description="Anyone with this link can view and forward this snapshot. Existing links cannot be revoked. Later edits to your plan will not appear here."
      >
        <p className="mb-4 text-sm text-text-secondary">
          The link includes the plan title, programs and scheduled courses. It
          leaves out your account details and cloud plan ID. Check the title
          before sending.
        </p>
        {url && (
          <>
            <label className="text-sm font-medium" htmlFor="snapshot-link">
              Read-only snapshot link
            </label>
            <textarea
              id="snapshot-link"
              readOnly
              value={url}
              rows={3}
              onFocus={(e) => e.currentTarget.select()}
              className="my-2 w-full break-all rounded-row border border-border-strong p-2 text-xs"
            />
            <button
              type="button"
              onClick={() => void copy()}
              className="rounded-row bg-accent px-4 py-2 text-surface"
            >
              Copy link
            </button>
            {copied && (
              <p role="status" className="mt-3 text-sm">
                Link copied.
              </p>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        )}
      </Modal>
    </>
  );
}
