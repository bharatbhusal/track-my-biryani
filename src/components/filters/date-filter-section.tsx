"use client";

import { DropdownList } from "@/components/ui/dropdown-list";
import { Input } from "@/components/ui/input";
import { FilterSection } from "./section";
import { presetLabel } from "@/lib/date-range";
import {
	getLocalDateTimeInputValue,
	toUtcIsoString,
} from "@/lib/datetime";
import type { FilterDatePreset } from "@/types/search.types";
import { dateSummary } from "./section-summary";

export const PRESETS: FilterDatePreset[] = [
	"TODAY",
	"YESTERDAY",
	"THIS_WEEK",
	"LAST_WEEK",
	"THIS_MONTH",
	"LAST_MONTH",
	"LAST_6_MONTHS",
	"THIS_YEAR",
	"LAST_YEAR",
	"ANY_TIME",
	"CUSTOM",
];

type DateChange = {
	preset: FilterDatePreset;
	customFrom?: string;
	customTo?: string;
};

type DateFilterSectionProps = {
	preset: FilterDatePreset;
	customFrom?: string;
	customTo?: string;
	onChange: (next: DateChange) => void;
	onClear: () => void;
	defaultOpen?: boolean;
};

function toInputValue(iso: string | undefined): string {
	if (!iso) return "";
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "";
	return getLocalDateTimeInputValue(date);
}

export function DateFilterSection({
	preset,
	customFrom,
	customTo,
	onChange,
	onClear,
	defaultOpen,
}: DateFilterSectionProps) {
	const isCustom = preset === "CUSTOM";

	// ponytail: the datetime-local value is a bare "2026-01-05T14:30" that the
	// browser treats as local — new Date() keeps it local, so toISOString()
	// lands on the right UTC instant with no day shift.
	const setBound = (key: "customFrom" | "customTo", value: string) =>
		onChange({
			preset,
			customFrom,
			customTo,
			[key]: value ? toUtcIsoString(value) : undefined,
		});

	return (
		<FilterSection
			title="Date"
			onClear={onClear}
			defaultOpen={defaultOpen}
			summary={dateSummary(preset, customFrom, customTo)}
		>
			<div className="space-y-2">
				<DropdownList
					value={preset}
					onValueChange={(v) => {
						const next = v as FilterDatePreset;
						onChange(
							next === "CUSTOM"
								? { preset: next, customFrom, customTo }
								: { preset: next },
						);
					}}
					options={PRESETS.map((p) => ({
						value: p,
						label: p === "CUSTOM" ? "Custom Range" : presetLabel(p),
					}))}
				/>
				{isCustom ? (
					<div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
						<label className="space-y-1">
							<span className="text-xs text-[var(--color-muted)]">From</span>
							<Input
								type="datetime-local"
								value={toInputValue(customFrom)}
								onChange={(e) => setBound("customFrom", e.target.value)}
							/>
						</label>
						<label className="space-y-1">
							<span className="text-xs text-[var(--color-muted)]">To</span>
							<Input
								type="datetime-local"
								value={toInputValue(customTo)}
								onChange={(e) => setBound("customTo", e.target.value)}
							/>
						</label>
					</div>
				) : null}
			</div>
		</FilterSection>
	);
}
