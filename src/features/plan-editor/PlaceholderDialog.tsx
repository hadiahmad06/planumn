"use client";

import { useId, useState, type FormEvent } from "react";
import { TWIN_CITIES_LIBED } from "@/domain/libed";
import { cleanPlaceholder } from "@/domain/planOps";
import { termLabel, type TermCode } from "@/domain/terms";
import { Modal } from "@/components/ui/Modal";
import { planActions } from "./store";

const SUGGESTIONS = ["Major elective", "Technical elective", "Upper-division elective (3xxx+)", "Free elective", "Minor course"];

/**
 * "Add a placeholder" dialog for a semester (B2). Written by Ishaan's Claude.
 * A placeholder is a slot for a course not chosen yet; its credits count toward the plan.
 */
export function PlaceholderDialog({ term, open, onOpenChange }: { term: TermCode; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [label, setLabel] = useState("");
  const [libEd, setLibEd] = useState("");
  const [credits, setCredits] = useState("3");
  const [error, setError] = useState("");
  const ids = { label: useId(), libEd: useId(), credits: useId(), list: useId() };

  const reset = () => {
    setLabel("");
    setLibEd("");
    setCredits("3");
    setError("");
  };

  const pickLibEd = (code: string) => {
    setLibEd(code);
    const d = TWIN_CITIES_LIBED.find((x) => x.code === code);
    // Fill the label when it's empty or still the previous Lib Ed suggestion.
    if (d && (!label.trim() || label.startsWith("Lib Ed: "))) setLabel(`Lib Ed: ${d.label}`);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const clean = cleanPlaceholder({ label, credits: Number(credits), libEd: libEd || undefined });
    if (!clean) {
      setError("Give the placeholder a name and 0–20 credits.");
      return;
    }
    planActions.addPlaceholder(term, clean);
    reset();
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
      title={`Add a placeholder to ${termLabel(term)}`}
      description="Hold a spot for a course you haven't picked yet. Its credits count toward this semester and your plan."
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor={ids.libEd} className="text-sm font-medium">
            Lib Ed designation (optional)
          </label>
          <select
            id={ids.libEd}
            value={libEd}
            onChange={(e) => pickLibEd(e.target.value)}
            className="rounded-row border border-border bg-surface px-2 py-1.5"
          >
            <option value="">None</option>
            {TWIN_CITIES_LIBED.map((d) => (
              <option key={d.code} value={d.code}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={ids.label} className="text-sm font-medium">
            Name
          </label>
          <input
            id={ids.label}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            list={ids.list}
            maxLength={80}
            placeholder="e.g. CSCI 3xxx elective"
            className="rounded-row border border-border bg-surface px-2 py-1.5"
            autoFocus
          />
          <datalist id={ids.list}>
            {SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={ids.credits} className="text-sm font-medium">
            Credits
          </label>
          <input
            id={ids.credits}
            type="number"
            inputMode="decimal"
            min={0}
            max={20}
            step={0.5}
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
            className="w-24 rounded-row border border-border bg-surface px-2 py-1.5"
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => onOpenChange(false)} className="rounded-row border border-border-strong px-4 py-2">
            Cancel
          </button>
          <button type="submit" className="rounded-row bg-accent px-4 py-2 font-medium text-surface hover:bg-accent-hover">
            Add placeholder
          </button>
        </div>
      </form>
    </Modal>
  );
}
