"use client";

import { Chip } from "@/components/ui/chip";
import { presetLabel } from "@/lib/date-range";
import {
	useAppDispatch,
	useAppSelector,
} from "@/store/hooks";
import type { BucketSummary } from "@/types/bucket.types";
import type { CategoryItem } from "@/types/expense.types";
import type { FilterOwner } from "./owner-filter-section";
import { customRangeLabel } from "./section-summary";
import {
	ACTIONS,
	SLICE_KEY,
	resolveSections,
	sortFieldLabel,
	sortForVariant,
	type FilterSliceState,
	type FilterVariant,
	type SectionFlags,
} from "./variants";

type FilterChipsProps = {
	variant: FilterVariant;
	buckets: BucketSummary[];
	categories: CategoryItem[];
	owners: FilterOwner[];
	sections?: Partial<SectionFlags>;
	hideDate?: boolean;
	hideSort?: boolean;
};

export function FilterChips({
	variant,
	buckets,
	categories,
	owners,
	sections: sectionsOverride,
	hideDate,
	hideSort,
}: FilterChipsProps) {
	const dispatch = useAppDispatch();
	const actions = ACTIONS[variant];
	const sections = resolveSections(
		variant,
		sectionsOverride,
	);

	const sliceState = useAppSelector(
		(s) =>
			(s as unknown as Record<string, FilterSliceState>)[
				SLICE_KEY[variant]
			],
	);
	const { filterCriteria, sortCriteria } = sliceState;

	const chips: React.ReactNode[] = [];

	const removeId = (
		set: (p: { preset: never; ids: string[] }) => unknown,
		ids: string[],
		id: string,
		fallbackClear?: () => unknown,
	) => {
		const next = ids.filter((v) => v !== id);
		if (next.length === 0 && fallbackClear) {
			dispatch(fallbackClear() as never);
			return;
		}
		dispatch(
			set({ preset: "MULTIPLE" as never, ids: next }) as never,
		);
	};

	if (sections.search && filterCriteria.q) {
		chips.push(
			<Chip
				key="search"
				label={`Search: ${filterCriteria.q}`}
				onRemove={
					actions.setSearch
						? () => dispatch(actions.setSearch!(undefined))
						: undefined
				}
			/>,
		);
	}

	const { datePreset, customFrom, customTo } =
		filterCriteria;
	if (sections.date && !hideDate) {
		const isCustom = datePreset === "CUSTOM";
		const clearDate = actions.clearDateFilter
			? () => dispatch(actions.clearDateFilter!())
			: undefined;
		chips.push(
			<Chip
				key="date"
				label={
					isCustom
						? customRangeLabel(customFrom, customTo)
						: presetLabel(datePreset)
				}
				onRemove={clearDate}
			/>,
		);
	}

	if (sections.buckets) {
		const { bucketPreset, bucketIds = [] } = filterCriteria;
		if (bucketPreset === "PERSONAL") {
			chips.push(
				<Chip
					key="bucket-personal"
					label="Personal"
					variant="muted"
				/>,
			);
		} else if (bucketPreset === "ALL") {
			chips.push(
				<Chip
					key="bucket-all"
					label="All buckets"
					onRemove={
						actions.clearBucketFilter
							? () => dispatch(actions.clearBucketFilter!())
							: undefined
					}
				/>,
			);
		} else if (bucketPreset === "MULTIPLE") {
			for (const id of bucketIds) {
				const bucket = buckets.find((b) => b._id === id);
				chips.push(
					<Chip
						key={`bucket-${id}`}
						label={bucket?.name ?? "Bucket"}
						icon={bucket?.icon}
						onRemove={() =>
							removeId(
								actions.setBucketFilter as never,
								bucketIds,
								id,
								actions.clearBucketFilter,
							)
						}
					/>,
				);
			}
		}
	}

	if (sections.categories) {
		const { categoryPreset, categoryIds = [] } =
			filterCriteria;
		if (categoryPreset === "ALL") {
			chips.push(
				<Chip
					key="category-all"
					label="All categories"
					variant="muted"
				/>,
			);
		} else if (categoryPreset === "MULTIPLE") {
			for (const id of categoryIds) {
				const category = categories.find((c) => c._id === id);
				chips.push(
					<Chip
						key={`category-${id}`}
						label={category?.name ?? "Category"}
						icon={category?.emoji}
						onRemove={() =>
							removeId(
								actions.setCategoryFilter as never,
								categoryIds,
								id,
								actions.clearCategoryFilter,
							)
						}
					/>,
				);
			}
		}
	}

	if (sections.owners) {
		const { ownerPreset, ownerIds = [] } = filterCriteria;
		if (ownerPreset === "ME") {
			chips.push(
				<Chip key="owner-me" label="Me" variant="muted" />,
			);
		} else if (ownerPreset === "ALL") {
			chips.push(
				<Chip
					key="owner-all"
					label="All users"
					onRemove={
						actions.clearOwnerFilter
							? () => dispatch(actions.clearOwnerFilter!())
							: undefined
					}
				/>,
			);
		} else if (ownerPreset === "MULTIPLE") {
			for (const id of ownerIds) {
				const owner = owners.find((o) => o.id === id);
				chips.push(
					<Chip
						key={`owner-${id}`}
						label={owner?.name ?? owner?.username ?? "User"}
						onRemove={() =>
							removeId(
								actions.setOwnerFilter as never,
								ownerIds,
								id,
								actions.clearOwnerFilter,
							)
						}
					/>,
				);
			}
		}
	}

	if (sections.sort && !hideSort && sortCriteria?.field) {
		const effectiveField = sortForVariant(
			variant,
			sortCriteria,
		).field;
		chips.push(
			<Chip
				key="sort"
				variant="muted"
				label={`${sortFieldLabel(variant, effectiveField)} ${
					sortCriteria.direction === "ASC" ? "↑" : "↓"
				}`}
				onRemove={
					actions.clearSort
						? () => dispatch(actions.clearSort!())
						: undefined
				}
			/>,
		);
	}

	if (sections.additional) {
		const { hasNotes, hasLocation } = filterCriteria;
		const clearAdditional = actions.clearAdditionalFilters;
		if (hasNotes !== undefined) {
			chips.push(
				<Chip
					key="has-notes"
					label={hasNotes ? "Has notes" : "No notes"}
					onRemove={
						actions.setHasNotes
							? () => dispatch(actions.setHasNotes!(undefined))
							: clearAdditional
								? () => dispatch(clearAdditional())
								: undefined
					}
				/>,
			);
		}
		if (hasLocation !== undefined) {
			chips.push(
				<Chip
					key="has-location"
					label={hasLocation ? "Has location" : "No location"}
					onRemove={
						actions.setHasLocation
							? () => dispatch(actions.setHasLocation!(undefined))
							: clearAdditional
								? () => dispatch(clearAdditional())
								: undefined
					}
				/>,
			);
		}
	}

	return <>{chips}</>;
}
