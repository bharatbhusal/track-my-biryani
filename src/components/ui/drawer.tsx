"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DrawerProps = {
	open: boolean;
	title?: string;
	onClose: () => void;
	children: React.ReactNode;
	side?: "right" | "left" | "bottom";
	className?: string;
};

export function Drawer({
	open,
	title,
	onClose,
	children,
	side = "right",
	className,
}: DrawerProps) {
	const contentBase =
		"fixed z-50 bg-[var(--color-surface)] border-l border-[var(--color-border)] shadow-lg p-4 overflow-auto";

	const sideClass =
		side === "right"
			? "right-0 top-0 h-full w-full md:w-[420px]"
			: side === "left"
				? "left-0 top-0 h-full w-full md:w-[420px]"
				: "left-0 right-0 bottom-0 h-[320px] w-full";

	return (
		<DialogPrimitive.Root
			open={open}
			onOpenChange={(v) => !v && onClose()}
		>
			<DialogPrimitive.Portal>
				<DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40" />
				<DialogPrimitive.Content
					className={cn(contentBase, sideClass, className)}
				>
					<div className="mb-3 flex items-start justify-between gap-3">
						<div>
							{title ? (
								<DialogPrimitive.Title className="text-base font-semibold">
									{title}
								</DialogPrimitive.Title>
							) : null}
						</div>
						<DialogPrimitive.Close asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								aria-label="Close drawer"
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

export default Drawer;
