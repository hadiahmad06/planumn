"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import type { ReactNode } from "react";
import { cn } from "./cn";

/** Dropdown menu: <Menu trigger={<button/>}><MenuItem onSelect={...}>Label</MenuItem></Menu> */
export function Menu({ trigger, children, align = "end" }: { trigger: ReactNode; children: ReactNode; align?: "start" | "end" }) {
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={4}
          className="z-50 min-w-44 rounded-card border border-border bg-surface p-1 shadow-overlay"
        >
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function MenuItem({ children, onSelect, danger, disabled }: { children: ReactNode; onSelect: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <DropdownMenu.Item
      disabled={disabled}
      onSelect={onSelect}
      className={cn(
        "cursor-default rounded-row px-2 py-1.5 text-body outline-none select-none data-[disabled]:opacity-40 data-[highlighted]:bg-sunken",
        danger ? "text-danger" : "text-text-primary",
      )}
    >
      {children}
    </DropdownMenu.Item>
  );
}

export function MenuSeparator() {
  return <DropdownMenu.Separator className="my-1 h-px bg-border" />;
}

/** Same items as ContextMenu, opened by a trigger (used for tap menus on mobile). */
export function ActionMenu({ trigger, actions, align = "start" }: { trigger: ReactNode; actions: { label: string; run: () => void; danger?: boolean; separated?: boolean }[]; align?: "start" | "end" }) {
  return (
    <Menu trigger={trigger} align={align}>
      {actions.map((a) => (
        <div key={a.label}>
          {a.separated && <MenuSeparator />}
          <MenuItem onSelect={a.run} danger={a.danger}>
            {a.label}
          </MenuItem>
        </div>
      ))}
    </Menu>
  );
}
