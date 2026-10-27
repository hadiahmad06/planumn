"use client";

import * as Dialog from "@radix-ui/react-dialog";

/** Controlled confirmation dialog. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-text-primary/20" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[min(420px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-modal bg-surface p-6 shadow-overlay">
          <Dialog.Title className="text-label font-semibold">{title}</Dialog.Title>
          <Dialog.Description className="mt-2 text-text-secondary">{description}</Dialog.Description>
          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close className="rounded-full px-4 py-1.5 text-text-secondary hover:bg-sunken">Cancel</Dialog.Close>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
              className="rounded-full bg-danger px-4 py-1.5 text-surface hover:opacity-90"
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
