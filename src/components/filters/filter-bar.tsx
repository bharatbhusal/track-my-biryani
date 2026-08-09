"use client";

import { useState } from "react";
import { FiFilter } from "react-icons/fi";

import { ConfirmDialog } from "@/components/modals/dialog";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/store/hooks";
import type { BucketSummary } from "@/types/bucket.types";
import type { CategoryItem } from "@/types/expense.types";
import { FilterChips } from "./filter-chips";
import { DateDropdown } from "./date-dropdown";
import { SortDropdown } from "./sort-dropdown";
import { FilterDialog } from "./filter-dialog";
import type { FilterOwner } from "./owner-filter-section";
import {
	ACTIONS,
	defaultSort,
	resolveSections,
	type FilterVariant,
	type LocalFilter,
	type SectionFlags,
} from "./variants";

type FilterBarProps = {
	variant: FilterVariant;
	buckets: BucketSummary[];
	categories: CategoryItem[];
	owners: FilterOwner[];
	sections?: Partial<SectionFlags>;
	local?: LocalFilter;
};

export function FilterBar({
	variant,
	buckets,
	categories,
	owners,
	sections,
	local,
}: FilterBarProps) {
	const dispatch = useAppDispatch();
	const [open, setOpen] = useState(false);
	const [confirmClear, setConfirmClear] = useState(false);
	const clearAllFilters = ACTIONS[variant].clearAllFilters;
	const canClear = local ? true : !!clearAllFilters;
	const resolvedSections = resolveSections(variant, sections);

	return (
		<>
			<div className="flex items-center gap-2">
				<Button
					type="button"
					variant="outline"
					size="icon"
					aria-label="Open filters"
					onClick={() => setOpen(true)}
					className="shrink-0"
				>
					<FiFilter className="h-4 w-4" />
				</Button>

				<div className="scrollbar-hide flex flex-1 items-center gap-2 overflow-x-auto">
					{resolvedSections.date ? (
						<DateDropdown
							variant={variant}
							local={local}
							onCustomOpen={() => setOpen(true)}
						/>
					) : null}
					{resolvedSections.sort ? (
						<SortDropdown variant={variant} local={local} />
					) : null}
					<FilterChips
						variant={variant}
						buckets={buckets}
						categories={categories}
						owners={owners}
						sections={sections}
						local={local}
						hideDate={resolvedSections.date}
						hideSort={resolvedSections.sort}
					/>
				</div>

				{canClear ? (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => setConfirmClear(true)}
						className="shrink-0 text-[var(--color-muted)]"
					>
						Clear
					</Button>
				) : null}
			</div>

			<FilterDialog
				variant={variant}
				open={open}
				onClose={() => setOpen(false)}
				sections={sections}
				local={local}
			/>

			<ConfirmDialog
				open={confirmClear}
				title="Clear all filters"
				subtitle="This resets every filter"
				description="All selected buckets, categories, users, dates and sorting will be reset to their defaults."
				onConfirm={() => {
					if (local) {
						local.onChange({
							filterCriteria: { datePreset: "THIS_MONTH" },
							sortCriteria: defaultSort(variant),
						});
					} else if (clearAllFilters) {
						dispatch(clearAllFilters());
					}
					setConfirmClear(false);
				}}
				onCancel={() => setConfirmClear(false)}
			/>
		</>
	);
}
