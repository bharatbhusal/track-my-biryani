"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ModalProps = {
	open: boolean;
	title: string;
	description?: string;
	onClose: () => void;
	children: React.ReactNode;
	className?: string;
};

export function Modal({
	open,
	title,
	description,
	onClose,
	children,
	className,
}: ModalProps) {
	return (
		<DialogPrimitive.Root open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogPrimitive.Portal>
				<DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40" />
				<DialogPrimitive.Content
					className={cn(
						"fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-xl max-h-[90vh] overflow-auto",
						className,
					)}
				>
					<div className="mb-3 flex items-start justify-between gap-3">
						<div>
							<DialogPrimitive.Title className="text-base font-semibold">
								{title}
							</DialogPrimitive.Title>
							{description ? (
								<DialogPrimitive.Description className="text-sm text-[var(--color-muted)]">
									{description}
								</DialogPrimitive.Description>
							) : null}
						</div>
						<DialogPrimitive.Close asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								aria-label="Close modal"
							>
								<X className="h-4 w-4" />
							</Button>
						</DialogPrimitive.Close>
					</div>
					{children}
				</DialogPrimitive.Content>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	);
}

type ConfirmDialogProps = {
	open: boolean;
	title: string;
	description: string;
	onConfirm: () => void;
	onCancel: () => void;
};

export function ConfirmDialog({
	open,
	title,
	description,
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	return (
		<Modal open={open} title={title} description={description} onClose={onCancel} className="max-w-sm">
			<div className="mt-4 flex justify-end gap-2">
				<Button variant="ghost" onClick={onCancel}>
					Cancel
				</Button>
				<Button variant="destructive" onClick={onConfirm}>
					Confirm
				</Button>
			</div>
		</Modal>
	);
}

export function DialogBody({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
