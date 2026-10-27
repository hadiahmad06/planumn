"use client";

import * as Popover from "@radix-ui/react-popover";
import { useState } from "react";
import { PlusIcon } from "@/components/ui/icons";
import { planActions } from "@/features/plan-editor/store";
import { searchPrograms } from "./programOptions";

/** "Add program" popover with a searchable list of UMN majors and minors (A22). */
export function ProgramPicker({ selected }: { selected: string[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const results = searchPrograms(query).filter((p) => !selected.includes(p.id));

  return (
    <Popover.Root open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery(""); }}>
      <Popover.Trigger className="flex items-center gap-1 rounded-full border border-dashed border-border-strong px-2.5 py-1 text-micro text-text-secondary hover:border-accent hover:text-accent">
        <PlusIcon size={12} /> {selected.length ? "Add program" : "Add your major or minor"}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={6} className="z-50 w-80 rounded-card border border-border bg-surface p-2 shadow-overlay">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search majors and minors…"
            aria-label="Search programs"
            className="mb-1 w-full rounded-row border border-border px-2 py-1.5 outline-none focus:border-accent"
          />
          <ul className="max-h-72 overflow-auto">
            {results.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    planActions.addProgram(p.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="w-full rounded-row px-2 py-1.5 text-left hover:bg-sunken"
                >
                  {p.name}
                </button>
              </li>
            ))}
            {results.length === 0 && <li className="px-2 py-1.5 text-text-tertiary">No matching programs</li>}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
