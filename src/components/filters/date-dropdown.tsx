"use client";

import { DropdownList } from "@/components/ui/dropdown-list";
import { presetLabel } from "@/lib/date-range";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { FilterDatePreset } from "@/types/search.types";
import { PRESETS } from "./date-filter-section";
import type { FilterSliceState, FilterVariant } from "./variants";
import { ACTIONS, SLICE_KEY } from "./variants";

type DateDropdownProps = {
	variant: FilterVariant;
	onCustomOpen: () => void;
};

// ponytail: a quick preset picker for the bar; Custom routes into the dialog
// where the from/to inputs already live — no duplicate range UI here.
export function DateDropdown({
	variant,
	onCustomOpen,
}: DateDropdownProps) {
	const dispatch = useAppDispatch();
	const sliceState = useAppSelector(
		(s) =>
			(s as unknown as Record<string, FilterSliceState>)[
				SLICE_KEY[variant]
			],
	);
	const filterCriteria = sliceState.filterCriteria;

	const setPreset = (preset: FilterDatePreset) => {
		if (preset === "CUSTOM") {
			onCustomOpen();
			return;
		}
		dispatch(ACTIONS[variant].setDateFilter!({ preset }));
	};

	return (
		<DropdownList
			value={filterCriteria.datePreset}
			onValueChange={(v) => setPreset(v as FilterDatePreset)}
			options={PRESETS.map((p) => ({
				value: p,
				label: p === "CUSTOM" ? "Custom Range" : presetLabel(p),
			}))}
			className="w-40 px-2 py-1.5 text-sm"
		/>
	);
}
