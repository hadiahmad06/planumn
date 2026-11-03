"use client";

import * as RCM from "@radix-ui/react-context-menu";
import type { ReactNode } from "react";
import { cn } from "./cn";

export interface MenuAction {
  label: string;
  run: () => void;
  danger?: boolean;
  separated?: boolean;
}

/** Right-click menu around `children`. */
export function ContextMenu({ actions, children }: { actions: MenuAction[]; children: ReactNode }) {
  return (
    <RCM.Root modal={false}>
      <RCM.Trigger asChild>{children}</RCM.Trigger>
      <RCM.Portal>
        <RCM.Content className="z-50 min-w-48 rounded-card border border-border bg-surface p-1 shadow-overlay">
          {actions.map((a) => (
            <div key={a.label}>
              {a.separated && <RCM.Separator className="my-1 h-px bg-border" />}
              <RCM.Item
                onSelect={a.run}
                className={cn(
                  "cursor-default rounded-row px-2 py-1.5 text-body outline-none select-none data-[highlighted]:bg-sunken",
                  a.danger ? "text-danger" : "text-text-primary",
                )}
              >
                {a.label}
              </RCM.Item>
            </div>
          ))}
        </RCM.Content>
      </RCM.Portal>
    </RCM.Root>
  );
}
