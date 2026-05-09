'use client';

import { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

type AppModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  fullScreenOnMobile?: boolean;
};

export function AppModal({ open, title, onClose, children, fullScreenOnMobile = false }: AppModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 md:items-center md:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl ${
          fullScreenOnMobile ? 'h-[92vh] rounded-t-2xl md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-2xl' : 'rounded-t-2xl md:max-w-md md:rounded-2xl'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] p-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <Button type="button" variant="ghost" onClick={onClose} aria-label="Close modal">
            ✕
          </Button>
        </div>
        <div className={`p-4 ${fullScreenOnMobile ? 'h-[calc(92vh-74px)] overflow-y-auto md:h-auto' : ''}`}>{children}</div>
      </div>
    </div>
  );
}

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({ open, title, description, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <AppModal open={open} title={title} onClose={onCancel}>
      <div className="w-full max-w-sm">
        <p className="mt-2 text-sm text-[var(--color-muted)]">{description}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </AppModal>
  );
}

export function DialogBody({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
