"use client";

import { ReactNode, useEffect } from "react";

import { Button } from "@/components/ui/button";

type ModalProps = {
	open: boolean;
	title: string;
	description?: string;
	onClose: () => void;
	children: ReactNode;
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
	useEffect(() => {
		if (!open) return;

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};

		document.addEventListener("keydown", handleEscape);
		return () => {
			document.removeEventListener("keydown", handleEscape);
		};
	}, [onClose, open]);

	if (!open) {
		return null;
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="app-modal-title"
			aria-describedby={
				description ? "app-modal-description" : undefined
			}
			onClick={onClose}
		>
			<div
				className={`w-full max-w-2xl rounded-t-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-xl sm:rounded-xl ${className ?? ""}`}
				onClick={(event) => event.stopPropagation()}
			>
				<div className="mb-3 flex items-start justify-between gap-3">
					<div>
						<h2
							id="app-modal-title"
							className="text-base font-semibold"
						>
							{title}
						</h2>
						{description && (
							<p
								id="app-modal-description"
								className="text-sm text-[var(--color-muted)]"
							>
								{description}
							</p>
						)}
					</div>
					<Button
						type="button"
						variant="ghost"
						onClick={onClose}
						aria-label="Close modal"
						className="h-8 w-8 p-0"
					>
						x
					</Button>
				</div>
				{children}
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

export function ConfirmDialog({
	open,
	title,
	description,
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	if (!open) {
		return null;
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="confirm-title"
		>
			<div className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
				<h2
					id="confirm-title"
					className="text-base font-semibold"
				>
					{title}
				</h2>
				<p className="mt-2 text-sm text-[var(--color-muted)]">
					{description}
				</p>
				<div className="mt-4 flex justify-end gap-2">
					<Button variant="ghost" onClick={onCancel}>
						Cancel
					</Button>
					<Button variant="destructive" onClick={onConfirm}>
						Confirm
					</Button>
				</div>
			</div>
		</div>
	);
}

export function DialogBody({
	children,
}: {
	children: ReactNode;
}) {
	return <>{children}</>;
}
