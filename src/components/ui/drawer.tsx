"use client";

import type { ReactNode } from "react";
import { Drawer as VaulDrawer } from "vaul";

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
	return (
		<VaulDrawer.Root
			open={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) onClose();
			}}
		>
			<VaulDrawer.Portal>
				<VaulDrawer.Overlay className="fixed inset-0 z-50 bg-black/30" />
				<VaulDrawer.Content
					className={`fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[90dvh] flex-col rounded-t-xl border border-[var(--color-border)] bg-[var(--color-bg)] ${className}`}
				>
					<div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
						<div>
							<VaulDrawer.Title className="text-base font-semibold">
								{title}
							</VaulDrawer.Title>
							{description && (
								<VaulDrawer.Description className="text-xs text-[var(--color-muted)]">
									{description}
								</VaulDrawer.Description>
							)}
						</div>
						<VaulDrawer.Close className="rounded-md p-1 text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]">
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
						</VaulDrawer.Close>
					</div>
					<div className="overflow-y-auto px-4 py-3">
						{children}
					</div>
				</VaulDrawer.Content>
			</VaulDrawer.Portal>
		</VaulDrawer.Root>
	);
}

type ConfirmDrawerProps = {
	open: boolean;
	title: string;
	description: string;
	onConfirm: () => void;
	onCancel: () => void;
};

export function ConfirmDrawer({
	open,
	title,
	description,
	onConfirm,
	onCancel,
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
					className="flex-1 rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-surface-muted)] transition-colors"
				>
					Cancel
				</button>
				<button
					type="button"
					onClick={onConfirm}
					className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
				>
					Confirm
				</button>
			</div>
		</Drawer>
	);
}
