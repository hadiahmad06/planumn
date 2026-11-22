"use client";

/** L6 (Hadi's Claude, 2026-11-22): "Try again" on the 404 page (a full reload of the same URL). */
export function ReloadButton({ className }: { className: string }) {
  return (
    <button type="button" onClick={() => window.location.reload()} className={className}>
      Try again
    </button>
  );
}
