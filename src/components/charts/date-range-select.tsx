"use client";

import { FiCalendar } from "react-icons/fi";
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
		{ value: "this_week", label: "This Week" },
		{ value: "this_month", label: "This Month" },
		{ value: "this_year", label: "This Year" },
	];

export function DateRangeSelect({
	value,
	onChange,
	loading,
}: DateRangeSelectProps) {
	const handlePresetChange = (preset: string) => {
		const p = preset as DateRangePreset;
		onChange({ preset: p });
	};

	if (loading) {
		return (
			<div className="flex items-center gap-2 flex-nowrap">
				<Skeleton className="h-4 w-4" />
				<Skeleton className="h-8 w-28 rounded-md" />
			</div>
		);
	}

	return (
		<div className="flex items-center gap-2 flex-nowrap">
			<FiCalendar className="text-[var(--color-muted)] shrink-0" />
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
		</div>
	);
}
