"use client";

import * as React from "react";
import { FiX } from "react-icons/fi";

import { cn } from "@/lib/utils";

type ChipProps = {
	label: string;
	icon?: React.ReactNode;
	onRemove?: () => void;
	onClick?: () => void;
	variant?: "default" | "muted";
};

export function Chip({
	label,
	icon,
	onRemove,
	onClick,
	variant = "default",
}: ChipProps) {
	// ponytail: a real <button> only when there is no nested remove control,
	// otherwise the markup would be a button inside a button.
	const Wrapper = onClick && !onRemove ? "button" : "span";

	return (
		<Wrapper
			type={Wrapper === "button" ? "button" : undefined}
			onClick={onClick}
			className={cn(
				"inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200",
				variant === "default"
					? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
					: "border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text)]",
				onClick && "cursor-pointer hover:brightness-110 active:scale-[0.97]",
			)}
		>
			{icon ? <span className="shrink-0">{icon}</span> : null}
			<span className="whitespace-nowrap">{label}</span>
			{onRemove ? (
				<button
					type="button"
					aria-label={`Remove ${label}`}
					onClick={(e) => {
						e.stopPropagation();
						onRemove();
					}}
					className="-mr-1 rounded-full p-0.5 opacity-70 transition-opacity hover:opacity-100"
				>
					<FiX className="h-3 w-3" />
				</button>
			) : null}
		</Wrapper>
	);
}
