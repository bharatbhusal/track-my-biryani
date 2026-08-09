"use client";

import { cn } from "@/lib/utils";

type MultiSelectProps = {
	options: { value: string; label: string; icon?: string }[];
	selected: string[];
	onChange: (selected: string[]) => void;
	allLabel?: string;
	isAll: boolean;
	onAllChange: (isAll: boolean) => void;
	emptyLabel?: string;
};

const rowClass =
	"flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-[var(--color-surface-muted)]";

export function MultiSelect({
	options,
	selected,
	onChange,
	allLabel = "All",
	isAll,
	onAllChange,
	emptyLabel = "Nothing to select",
}: MultiSelectProps) {
	const toggle = (value: string) => {
		onChange(
			selected.includes(value)
				? selected.filter((v) => v !== value)
				: [...selected, value],
		);
	};

	return (
		<div className="max-h-56 space-y-0.5 overflow-y-auto rounded-xl border border-[var(--color-border)] p-1">
			<label className={rowClass}>
				<input
					type="checkbox"
					checked={isAll}
					onChange={(e) => onAllChange(e.target.checked)}
					className="h-4 w-4 shrink-0 accent-[var(--color-primary)]"
				/>
				<span className="font-medium">{allLabel}</span>
			</label>
			{options.length === 0 ? (
				<p className="px-3 py-2 text-xs text-[var(--color-muted)]">
					{emptyLabel}
				</p>
			) : null}
			{options.map((o) => (
				<label
					key={o.value}
					className={cn(rowClass, isAll && "opacity-50")}
				>
					<input
						type="checkbox"
						checked={!isAll && selected.includes(o.value)}
						disabled={isAll}
						onChange={() => toggle(o.value)}
						className="h-4 w-4 shrink-0 accent-[var(--color-primary)]"
					/>
					{o.icon ? <span>{o.icon}</span> : null}
					<span className="truncate">{o.label}</span>
				</label>
			))}
		</div>
	);
}
