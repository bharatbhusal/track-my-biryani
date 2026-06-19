"use client";

import {
	FiChevronLeft,
	FiChevronRight,
} from "react-icons/fi";
import type {
	DateRangePreset,
	GlobalDateRange,
} from "@/lib/date-range";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type DateRangeSelectProps = {
	value: GlobalDateRange;
	onChange: (range: GlobalDateRange) => void;
	loading?: boolean;
};

const presets: { value: DateRangePreset; label: string }[] =
	[
		{ value: "day", label: "Day" },
		{ value: "week", label: "Week" },
		{ value: "month", label: "Month" },
		{ value: "year", label: "Year" },
	];

export function DateRangeSelect({
	value,
	onChange,
	loading,
}: DateRangeSelectProps) {
	const isCurrent = value.offset === 0;

	const handlePrev = () => {
		onChange({ ...value, offset: value.offset + 1 });
	};

	const handleNext = () => {
		if (value.offset > 0) {
			onChange({ ...value, offset: value.offset - 1 });
		}
	};

	const handlePresetChange = (preset: string) => {
		onChange({
			preset: preset as DateRangePreset,
			offset: 0,
		});
	};

	if (loading) {
		return (
			<div className="flex items-center gap-1 flex-nowrap">
				<Skeleton className="h-4 w-4" />
				<Skeleton className="h-8 w-24 rounded-md" />
				<Skeleton className="h-4 w-4" />
			</div>
		);
	}

	return (
		<div className="flex items-center gap-1 flex-nowrap">
			<button
				type="button"
				onClick={handlePrev}
				disabled={loading}
				className="flex items-center justify-center h-8 w-8 rounded-md text-[var(--color-muted)] hover:bg-[color-mix(in_oklab,var(--color-bg)_96%,transparent)] disabled:opacity-30"
				aria-label="Previous period"
			>
				<FiChevronLeft className="h-4 w-4" />
			</button>
			<Select
				value={value.preset}
				onChange={(e) => handlePresetChange(e.target.value)}
				className="text-xs"
			>
				{presets.map((p) => (
					<option key={p.value} value={p.value}>
						{p.label}
					</option>
				))}
			</Select>
			<button
				type="button"
				onClick={handleNext}
				disabled={loading || isCurrent}
				className="flex items-center justify-center h-8 w-8 rounded-md text-[var(--color-muted)] hover:bg-[color-mix(in_oklab,var(--color-bg)_96%,transparent)] disabled:opacity-30"
				aria-label="Next period"
			>
				<FiChevronRight className="h-4 w-4" />
			</button>
		</div>
	);
}
