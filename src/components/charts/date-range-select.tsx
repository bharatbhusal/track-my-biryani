"use client";

import { useState } from "react";
import { FiCalendar } from "react-icons/fi";
import type { DateRangePreset, GlobalDateRange } from "@/lib/date-range";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type DateRangeSelectProps = {
	value: GlobalDateRange;
	onChange: (range: GlobalDateRange) => void;
};

const presets: { value: DateRangePreset; label: string }[] = [
	{ value: "this_week", label: "This Week" },
	{ value: "this_month", label: "This Month" },
	{ value: "this_year", label: "This Year" },
	{ value: "custom", label: "Custom" },
];

export function DateRangeSelect({ value, onChange }: DateRangeSelectProps) {
	const [showCustom, setShowCustom] = useState(value.preset === "custom");

	const handlePresetChange = (preset: string) => {
		const p = preset as DateRangePreset;
		setShowCustom(p === "custom");
		onChange({ preset: p });
	};

	return (
		<div className="flex items-center gap-2">
			<FiCalendar className="text-[var(--color-muted)] shrink-0" />
			<Select
				value={value.preset}
				onChange={(e) => handlePresetChange(e.target.value)}
				className="w-36 text-xs"
			>
				{presets.map((p) => (
					<option key={p.value} value={p.value}>
						{p.label}
					</option>
				))}
			</Select>
			{showCustom && (
				<div className="flex items-center gap-1">
					<Input
						type="date"
						value={value.from ?? ""}
						onChange={(e) =>
							onChange({ preset: "custom", from: e.target.value, to: value.to })
						}
						className="h-8 w-36 text-xs"
					/>
					<span className="text-xs text-[var(--color-muted)]">-</span>
					<Input
						type="date"
						value={value.to ?? ""}
						onChange={(e) =>
							onChange({ preset: "custom", from: value.from, to: e.target.value })
						}
						className="h-8 w-36 text-xs"
					/>
				</div>
			)}
		</div>
	);
}
