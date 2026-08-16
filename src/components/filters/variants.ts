import type { UnknownAction } from "@reduxjs/toolkit";

import * as filtersSlice from "@/store/slices/filtersSlice";
import type {
	BucketPreset,
	CategoryPreset,
	ExpenseFilterCriteria,
	FilterDatePreset,
	OwnerPreset,
	PaginationCriteria,
	SortCriteria,
	SortDirection,
} from "@/types/search.types";
import type { SortField } from "./sort-section";

export type FilterVariant = "expenses" | "categories" | "buckets" | "logs";

export type DraftCriteria = Partial<ExpenseFilterCriteria> & {
	datePreset: FilterDatePreset;
};

export type FilterValue = {
	filterCriteria: DraftCriteria;
	sortCriteria: SortCriteria;
};

export type FilterSliceState = FilterValue & {
	pagination: PaginationCriteria;
};

type FilterActions = {
	setBucketFilter?: (p: {
		preset: BucketPreset;
		ids: string[];
	}) => UnknownAction;
	setCategoryFilter?: (p: {
		preset: CategoryPreset;
		ids: string[];
	}) => UnknownAction;
	setOwnerFilter?: (p: {
		preset: OwnerPreset;
		ids: string[];
	}) => UnknownAction;
	setDateFilter?: (p: {
		preset: FilterDatePreset;
		customFrom?: string;
		customTo?: string;
	}) => UnknownAction;
	setSort?: (p: {
		field: string;
		direction: SortDirection;
	}) => UnknownAction;
	setSearch?: (p: string | undefined) => UnknownAction;
	setHasNotes?: (p: boolean | undefined) => UnknownAction;
	setHasLocation?: (p: boolean | undefined) => UnknownAction;
	clearBucketFilter?: () => UnknownAction;
	clearCategoryFilter?: () => UnknownAction;
	clearOwnerFilter?: () => UnknownAction;
	clearDateFilter?: () => UnknownAction;
	clearSort?: () => UnknownAction;
	clearAdditionalFilters?: () => UnknownAction;
	clearAllFilters?: () => UnknownAction;
};

export const SLICE_KEY = {
	expenses: "filters",
	categories: "filters",
	buckets: "filters",
	logs: "filters",
} as const;

// ponytail: every variant reads and writes the one shared filters slice, so a
// date picked on the dashboard is the same date everywhere else.
export const ACTIONS: Record<FilterVariant, FilterActions> = {
	expenses: filtersSlice,
	categories: filtersSlice,
	buckets: filtersSlice,
	logs: filtersSlice,
};

export type SectionName =
	| "buckets"
	| "categories"
	| "owners"
	| "additional"
	| "search"
	| "date"
	| "sort";

export type SectionFlags = Record<SectionName, boolean>;

export const SECTIONS: Record<FilterVariant, SectionFlags> = {
	expenses: {
		buckets: true,
		categories: true,
		owners: true,
		additional: true,
		search: true,
		date: true,
		sort: true,
	},
	categories: {
		buckets: true,
		categories: false,
		owners: true,
		additional: false,
		search: true,
		date: true,
		sort: true,
	},
	buckets: {
		buckets: false,
		categories: false,
		owners: false,
		additional: false,
		search: false,
		date: true,
		sort: true,
	},
	logs: {
		buckets: true,
		categories: false,
		owners: true,
		additional: false,
		search: false,
		date: true,
		sort: true,
	},
};

export function resolveSections(
	variant: FilterVariant,
	override?: Partial<SectionFlags>,
): SectionFlags {
	return { ...SECTIONS[variant], ...override };
}

export function defaultSort(variant: FilterVariant): SortCriteria {
	return { field: SORT_FIELDS[variant][0].value, direction: "DESC" };
}

// ponytail: the one shared sortCriteria is a preference every page interprets
// within its own field set — a sort picked on logs ("timestamp") is meaningless
// on the expenses list, so consumers normalize before use. Only the audit
// endpoint rejects unknown fields, but the others would silently sort by a
// nonexistent field, so the normalization happens at every boundary.
export function sortForVariant(
	variant: FilterVariant,
	sort: SortCriteria,
): SortCriteria {
	return SORT_FIELDS[variant].some((f) => f.value === sort.field)
		? sort
		: defaultSort(variant);
}

export const SORT_FIELDS: Record<FilterVariant, SortField[]> = {
	expenses: [
		{ value: "paidAt", label: "Paid At" },
		{ value: "amount", label: "Amount" },
	],
	categories: [
		{ value: "amount", label: "Amount" },
		{ value: "createdAt", label: "Created At" },
	],
	buckets: [
		{ value: "totalAmount", label: "Total Amount" },
		{ value: "memberCount", label: "Members" },
		{ value: "createdAt", label: "Created At" },
	],
	logs: [
		{ value: "timestamp", label: "Date" },
		{ value: "action", label: "Action" },
		{ value: "entity", label: "Entity" },
	],
};

export const VARIANT_TITLE: Record<FilterVariant, string> = {
	expenses: "Filter expenses",
	categories: "Filter categories",
	buckets: "Filter buckets",
	logs: "Filter logs",
};

export function sortFieldLabel(
	variant: FilterVariant,
	field: string,
): string {
	return (
		SORT_FIELDS[variant].find((f) => f.value === field)?.label ??
		field
	);
}
