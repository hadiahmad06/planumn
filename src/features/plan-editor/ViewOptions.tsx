"use client";

import * as Popover from "@radix-ui/react-popover";
import { SettingsIcon } from "@/components/ui/icons";
import { DisplaySettingsForm } from "./DisplaySettingsForm";

export function ViewOptions() {
  return (
    <Popover.Root>
      <Popover.Trigger className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-text-secondary hover:text-text-primary">
        <SettingsIcon /> View
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={6} className="z-50 w-72 rounded-card border border-border bg-surface p-4 shadow-overlay">
          <DisplaySettingsForm />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
