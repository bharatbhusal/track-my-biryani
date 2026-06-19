"use client";

import {
	useCallback,
	useEffect,
	useRef,
	type ReactNode,
} from "react";

type DrawerProps = {
	open: boolean;
	onClose: () => void;
	title: string;
	description?: string;
	children: ReactNode;
	className?: string;
};

export function Drawer({
	open,
	onClose,
	title,
	description,
	children,
	className = "",
}: DrawerProps) {
	const overlayRef = useRef<HTMLDivElement>(null);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		},
		[onClose],
	);

	useEffect(() => {
		if (open) {
			document.addEventListener("keydown", handleKeyDown);
			document.body.style.overflow = "hidden";
		}
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.body.style.overflow = "";
		};
	}, [open, handleKeyDown]);

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center"
			ref={overlayRef}
		>
			<div
				className="absolute inset-0 bg-black/40 backdrop-blur-sm"
				onClick={onClose}
			/>
			<div
				className={`relative z-10 mx-4 w-full max-w-lg rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-xl ${className}`}
			>
				<div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
					<div className="min-w-0">
						<h2 className="truncate text-base font-semibold text-[var(--color-foreground)]">
							{title}
						</h2>
						{description && (
							<p className="truncate text-xs text-[var(--color-muted)]">
								{description}
							</p>
						)}
					</div>
					<button
						type="button"
						onClick={onClose}
						className="ml-4 shrink-0 rounded-md p-1 text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)] transition-colors"
						aria-label="Close"
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M18 6 6 18" />
							<path d="m6 6 12 12" />
						</svg>
					</button>
				</div>
				<div className="max-h-[75vh] overflow-y-auto px-4 py-3">
					{children}
				</div>
			</div>
		</div>
	);
}

type ConfirmDrawerProps = {
	open: boolean;
	title: string;
	description: string;
	onConfirm: () => void;
	onCancel: () => void;
	isPending?: boolean;
};

export function ConfirmDrawer({
	open,
	title,
	description,
	onConfirm,
	onCancel,
	isPending,
}: ConfirmDrawerProps) {
	return (
		<Drawer
			open={open}
			onClose={onCancel}
			title={title}
			description={description}
		>
			<div className="flex gap-2 pt-2">
				<button
					type="button"
					onClick={onCancel}
					disabled={isPending}
					className="flex-1 rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-surface-muted)] transition-colors disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					type="button"
					onClick={onConfirm}
					disabled={isPending}
					className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
				>
					{isPending ? "Deleting..." : "Confirm"}
				</button>
			</div>
		</Drawer>
	);
}
