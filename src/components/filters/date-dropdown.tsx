"use client";

import { DropdownList } from "@/components/ui/dropdown-list";
import { presetLabel } from "@/lib/date-range";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { FilterDatePreset } from "@/types/search.types";
import { PRESETS } from "./date-filter-section";
import type { FilterVariant } from "./variants";
import { ACTIONS } from "./variants";

type DateDropdownProps = {
	variant: FilterVariant;
	onCustomOpen: () => void;
};

export function DateDropdown({ variant, onCustomOpen }: DateDropdownProps) {
	const dispatch = useAppDispatch();
	const sliceState = useAppSelector((s) => (s.filters as Record<string, any>)[variant]);
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
