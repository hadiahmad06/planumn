"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
/** Written by Michael's Codex. Reuses the actual 2025 demo, labelled as the earlier version. */
export function DemoVideo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-7 text-sm text-accent underline underline-offset-4"
      >
        Watch the original 2025 demo
      </button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="The original Planumn"
        description="This recording shows the 2025 app. The rebuilt planner may look and behave differently."
      >
        <video
          src="/videos/2025-demo.mp4"
          controls
          playsInline
          preload="none"
          aria-label="Demonstration of the original 2025 Planumn planner"
          className="w-full rounded-row"
        >
          <track
            kind="descriptions"
            src="/videos/2025-demo.vtt"
            srcLang="en"
            label="English visual overview"
            default
          />
        </video>
        <p className="mt-3 text-sm text-text-secondary">
          The demo shows searching for courses, dragging them into semesters,
          and opening course details. These are the core actions in the planner.
        </p>
      </Modal>
    </>
  );
}
