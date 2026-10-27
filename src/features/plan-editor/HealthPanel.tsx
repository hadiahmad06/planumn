"use client";

import * as Popover from "@radix-ui/react-popover";
import { GRADUATION_CREDITS } from "@/domain/health";
import type { Plan } from "@/domain/plan";
import { termLabel } from "@/domain/terms";
import { cn } from "@/components/ui/cn";
import { AlertIcon } from "@/components/ui/icons";
import { usePreviewStore } from "@/features/preview/store";
import { useHealth } from "./useHealth";

/** Plan health in the header (B5 pacing + B6 health check): credits toward 120, finish term, and every issue. */
export function HealthPanel({ plan }: { plan: Plan }) {
  const { issues, pace } = useHealth(plan);
  const openPreview = usePreviewStore((s) => s.openPreview);
  const warnings = issues.filter((i) => i.severity === "warning").length;

  return (
    <Popover.Root>
      <Popover.Trigger
        className={cn(
          "flex items-center gap-1.5 rounded-full border bg-surface px-2.5 py-1",
          warnings ? "border-warning/50 text-warning" : "border-border text-text-secondary",
        )}
      >
        {issues.length > 0 && <AlertIcon size={14} />}
        <span>
          <strong className="text-text-primary">{pace.credits}</strong>/{GRADUATION_CREDITS} cr
          {pace.finalTerm ? ` · last planned term ${termLabel(pace.finalTerm)}` : ""}
          {issues.length > 0 ? ` · ${issues.length} to check` : ""}
        </span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={6} className="z-50 w-[min(24rem,calc(100vw-24px))] rounded-card border border-border bg-surface p-4 shadow-overlay">
          <h3 className="font-semibold">Plan check</h3>
          <p className="mt-1 text-text-secondary">
            {pace.credits} of {GRADUATION_CREDITS} credits planned
            {pace.finalTerm ? `, last courses in ${termLabel(pace.finalTerm)}` : ""}. {pace.enough ? `Meets the ${GRADUATION_CREDITS}-credit baseline (not a degree audit).` : `${pace.remaining} to go.`}
          </p>
          {issues.length === 0 ? (
            <p className="mt-3 text-success">Nothing to fix right now.</p>
          ) : (
            <ul className="mt-3 flex max-h-80 flex-col gap-2 overflow-auto">
              {issues.map((i, n) => (
                <li key={n} className="flex gap-2">
                  <AlertIcon size={14} className={cn("mt-0.5 shrink-0", i.severity === "warning" ? "text-warning" : "text-text-tertiary")} />
                  {i.courseId != null ? (
                    <button type="button" onClick={() => openPreview(i.courseId!)} className="text-left hover:text-accent">
                      {i.term && <span className="text-micro text-text-tertiary">{termLabel(i.term)} · </span>}
                      {i.message}
                    </button>
                  ) : (
                    <span>{i.message}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-micro text-text-tertiary">Offering history comes from grade records through Fall 2024. Check with your adviser.</p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
