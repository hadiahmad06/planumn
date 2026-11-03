"use client";
import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
/** Written by Michael's Codex. Shared focus-trapped modal. */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[200] bg-text-primary/30" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[201] max-h-[90dvh] w-[min(460px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-modal border border-border bg-surface p-6 shadow-overlay">
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="text-xl font-semibold">
              {title}
            </Dialog.Title>
            <Dialog.Close
              aria-label="Close dialog"
              className="rounded-row px-2 text-xl focus-visible:outline-2 focus-visible:outline-accent"
            >
              ×
            </Dialog.Close>
          </div>
          <Dialog.Description className="mb-5 mt-2 text-sm text-text-secondary">
            {description}
          </Dialog.Description>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
