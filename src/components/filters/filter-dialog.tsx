"use client";

import { useState } from "react";

import { ConfirmDialog, Modal } from "@/components/modals/dialog";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { AdditionalFiltersSection } from "./additional-filters-section";
import { BucketFilterSection } from "./bucket-filter-section";
import { CategoryFilterSection } from "./category-filter-section";
import { DateFilterSection } from "./date-filter-section";
import { OwnerFilterSection } from "./owner-filter-section";
import { SearchSection } from "./search-section";
import { SortSection } from "./sort-section";
import { useScopedOptions } from "./use-scoped-options";
import {
	ACTIONS,
	SLICE_KEY,
	SORT_FIELDS,
	VARIANT_TITLE,
	defaultSort,
	resolveSections,
	type DraftCriteria,
	type FilterSliceState,
	type FilterVariant,
	type LocalFilter,
	type SectionFlags,
} from "./variants";
import type { SortCriteria } from "@/types/search.types";

type FilterDialogProps = {
	variant: FilterVariant;
	open: boolean;
	onClose: () => void;
	sections?: Partial<SectionFlags>;
	local?: LocalFilter;
};

export function FilterDialog({
	variant,
	open,
	onClose,
	sections: sectionsOverride,
	local,
}: FilterDialogProps) {
	const dispatch = useAppDispatch();
	const actions = ACTIONS[variant];
	const sections = resolveSections(variant, sectionsOverride);

	const sliceState = useAppSelector(
		(s) =>
			(s as unknown as Record<string, FilterSliceState>)[
				SLICE_KEY[variant]
			],
	);
	const state = local?.value ?? sliceState;
	const buckets = useAppSelector((s) => s.buckets.allBuckets);

	const [confirmClear, setConfirmClear] = useState(false);

	// ponytail: draft resets during render when `open` flips, the documented
	// "adjust state while rendering" pattern — cheaper than an effect and it
	// avoids a frame of stale filters.
	const [draft, setDraft] = useState({
		open,
		criteria: state.filterCriteria,
		sort: state.sortCriteria,
	});
	if (draft.open !== open) {
		setDraft({
			open,
			criteria: state.filterCriteria,
			sort: state.sortCriteria,
		});
	}
	const { criteria, sort } = draft;
	const setCriteria = (
		updater: (c: DraftCriteria) => DraftCriteria,
	) => setDraft((d) => ({ ...d, criteria: updater(d.criteria) }));
	const setSort = (next: SortCriteria) =>
		setDraft((d) => ({ ...d, sort: next }));

	const scoped = useScopedOptions(
		open && (sections.categories || sections.owners),
		buckets,
		criteria.bucketPreset,
		criteria.bucketIds,
	);

	const patch = (next: Partial<DraftCriteria>) =>
		setCriteria((c) => ({ ...c, ...next }));

	const apply = () => {
		if (local) {
			local.onChange({ filterCriteria: criteria, sortCriteria: sort });
			onClose();
			return;
		}
		if (sections.buckets && actions.setBucketFilter) {
			dispatch(
				actions.setBucketFilter({
					preset: criteria.bucketPreset ?? "PERSONAL",
					ids: criteria.bucketIds ?? [],
				}),
			);
		}
		if (sections.categories && actions.setCategoryFilter) {
			dispatch(
				actions.setCategoryFilter({
					preset: criteria.categoryPreset ?? "ALL",
					ids: criteria.categoryIds ?? [],
				}),
			);
		}
		if (sections.owners && actions.setOwnerFilter) {
			dispatch(
				actions.setOwnerFilter({
					preset: criteria.ownerPreset ?? "ME",
					ids: criteria.ownerIds ?? [],
				}),
			);
		}
		if (sections.date && actions.setDateFilter) {
			dispatch(
				actions.setDateFilter({
					preset: criteria.datePreset,
					customFrom: criteria.customFrom,
					customTo: criteria.customTo,
				}),
			);
		}
		if (sections.search && actions.setSearch) {
			dispatch(actions.setSearch(criteria.q));
		}
		if (sections.additional) {
			if (actions.setHasNotes)
				dispatch(actions.setHasNotes(criteria.hasNotes));
			if (actions.setHasLocation)
				dispatch(actions.setHasLocation(criteria.hasLocation));
		}
		if (sections.sort && actions.setSort) dispatch(actions.setSort(sort));
		onClose();
	};

	const clearAll = () => {
		if (local) {
			local.onChange({
				filterCriteria: { datePreset: "ANY_TIME" },
				sortCriteria: defaultSort(variant),
			});
		} else if (actions.clearAllFilters) {
			dispatch(actions.clearAllFilters());
		}
		setConfirmClear(false);
		onClose();
	};

	return (
		<>
			<Modal
				open={open}
				title={VARIANT_TITLE[variant]}
				subtitle="Narrow down what you see"
				onClose={onClose}
			>
				<div className="space-y-5">
					{sections.search ? (
						<SearchSection
							q={criteria.q ?? ""}
							onChange={(q) =>
								setCriteria((c) => ({
									...c,
									q: q || undefined,
								}))
							}
						/>
					) : null}

					{sections.buckets ? (
						<BucketFilterSection
							preset={criteria.bucketPreset ?? "PERSONAL"}
							bucketIds={criteria.bucketIds ?? []}
							buckets={buckets}
							onChange={({ preset, ids }) =>
								patch({ bucketPreset: preset, bucketIds: ids })
							}
							onClear={() =>
								patch({ bucketPreset: "PERSONAL", bucketIds: [] })
							}
							defaultOpen={false}
						/>
					) : null}

					{sections.categories ? (
						<CategoryFilterSection
							preset={criteria.categoryPreset ?? "ALL"}
							categoryIds={criteria.categoryIds ?? []}
							categories={scoped.categories}
							isLoading={scoped.isLoading}
							onChange={({ preset, ids }) =>
								patch({ categoryPreset: preset, categoryIds: ids })
							}
							onClear={() =>
								patch({ categoryPreset: "ALL", categoryIds: [] })
							}
							defaultOpen={false}
						/>
					) : null}

					{sections.owners ? (
						<OwnerFilterSection
							preset={criteria.ownerPreset ?? "ME"}
							ownerIds={criteria.ownerIds ?? []}
							owners={scoped.owners}
							isLoading={scoped.isLoading}
							onChange={({ preset, ids }) =>
								patch({ ownerPreset: preset, ownerIds: ids })
							}
							onClear={() => patch({ ownerPreset: "ME", ownerIds: [] })}
							defaultOpen={false}
						/>
					) : null}

					{sections.date ? (
						<DateFilterSection
							preset={criteria.datePreset}
							customFrom={criteria.customFrom}
							customTo={criteria.customTo}
							onChange={({ preset, customFrom, customTo }) =>
								setCriteria((c) => ({
									...c,
									datePreset: preset,
									customFrom,
									customTo,
								}))
							}
							onClear={() =>
								setCriteria((c) => ({
									...c,
									datePreset: "ANY_TIME",
									customFrom: undefined,
									customTo: undefined,
								}))
							}
							defaultOpen={true}
						/>
					) : null}

					{sections.sort ? (
						<SortSection
							field={sort.field}
							direction={sort.direction}
							fields={SORT_FIELDS[variant]}
							onChange={setSort}
							onClear={() => setSort(defaultSort(variant))}
							defaultOpen={false}
						/>
					) : null}

					{sections.additional ? (
						<AdditionalFiltersSection
							hasNotes={criteria.hasNotes}
							hasLocation={criteria.hasLocation}
							onChange={({ hasNotes, hasLocation }) =>
								setCriteria((c) => ({ ...c, hasNotes, hasLocation }))
							}
							onClear={() =>
								setCriteria((c) => ({
									...c,
									hasNotes: undefined,
									hasLocation: undefined,
								}))
							}
							defaultOpen={false}
						/>
					) : null}

					<div className="flex justify-end gap-2 border-t pt-4">
						<Button
							type="button"
							variant="ghost"
							onClick={() => setConfirmClear(true)}
						>
							Clear all
						</Button>
						<Button type="button" onClick={apply}>
							Apply
						</Button>
					</div>
				</div>
			</Modal>

			<ConfirmDialog
				open={confirmClear}
				title="Clear all filters"
				subtitle="This resets every filter"
				description="All selected buckets, categories, users, dates and sorting will be reset to their defaults."
				onConfirm={clearAll}
				onCancel={() => setConfirmClear(false)}
			/>
		</>
	);
}
