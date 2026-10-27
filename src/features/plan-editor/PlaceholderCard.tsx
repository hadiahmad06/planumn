"use client";

import type { PlaceholderCourse } from "@/domain/plan";
import type { TermCode } from "@/domain/terms";
import { CloseIcon } from "@/components/ui/icons";
import { planActions } from "./store";

/** A placeholder slot in a semester (B2). Written by Ishaan's Claude. Dashed, so it never reads as a real course. */
export function PlaceholderCard({ term, slot }: { term: TermCode; slot: PlaceholderCourse }) {
  return (
    <li className="flex min-h-11 list-none items-center gap-2 rounded-card border border-dashed border-border-strong bg-surface/50 px-2.5 py-1.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-text-primary" title={slot.label}>
          {slot.label}
        </p>
        <p className="text-micro text-text-tertiary">Placeholder{slot.libEd ? ` · Lib Ed ${slot.libEd}` : ""}</p>
      </div>
      <span className="shrink-0 text-micro text-text-secondary">{slot.credits} cr</span>
      <button
        type="button"
        onClick={() => planActions.removePlaceholder(term, slot.key)}
        aria-label={`Remove placeholder ${slot.label}`}
        className="shrink-0 rounded-full p-0.5 text-text-tertiary hover:bg-sunken hover:text-danger"
      >
        <CloseIcon size={12} />
      </button>
    </li>
  );
}
