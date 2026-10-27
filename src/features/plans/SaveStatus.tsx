"use client";

import { useEffect, useState } from "react";
import { useSaveState } from "./saveState";
/** Written by Michael's Codex. */
export function SaveStatus() {
  const { status, savedAt, local, error, retry } = useSaveState();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const minutes =
    savedAt && now
      ? Math.max(0, Math.floor((now - Date.parse(savedAt)) / 60000))
      : 0;
  return (
    <span
      role="status"
      className={`text-xs ${status === "error" ? "text-danger" : "text-text-secondary"}`}
    >
      {status === "error" ? (
        <>
          {error || "Saving failed."}{" "}
          <button type="button" onClick={retry} className="underline">
            Retry save
          </button>
        </>
      ) : status === "pending" || status === "saving" ? (
        "Saving…"
      ) : status === "saved" ? (
        `${local ? "Saved in this browser" : "Saved"}${minutes ? ` ${minutes} min ago` : " just now"}`
      ) : local ? (
        "Browser autosave"
      ) : (
        "Cloud autosave"
      )}
    </span>
  );
}
