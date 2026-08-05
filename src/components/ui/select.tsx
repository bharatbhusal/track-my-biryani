import * as React from "react";

import { cn } from "@/lib/utils";

export function Select({
	className,
	children,
	...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
	return (
		<select
			className={cn(
				"w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-base sm:text-sm text-[var(--color-text)] outline-none transition-all duration-200 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20",
				className,
			)}
			{...props}
		>
			{children}
		</select>
	);
}
