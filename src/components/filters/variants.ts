import type { UnknownAction } from "@reduxjs/toolkit";

import * as bucketsFilterSlice from "@/store/slices/bucketsFilterSlice";
import * as categoriesFilterSlice from "@/store/slices/categoriesFilterSlice";
import * as expensesFilterSlice from "@/store/slices/expensesFilterSlice";
import * as logsFilterSlice from "@/store/slices/logsFilterSlice";
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
	expenses: "expensesFilter",
	categories: "categoriesFilter",
	buckets: "bucketsFilter",
	logs: "logsFilter",
} as const;

export const ACTIONS: Record<FilterVariant, FilterActions> = {
	expenses: expensesFilterSlice,
	categories: categoriesFilterSlice,
	buckets: bucketsFilterSlice,
	logs: logsFilterSlice,
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

// ponytail: pages that own their filter state locally (a section of a detail
// page) pass `local` instead of leaning on a slice — no new reducer, and no
// leak into the page-wide filters other views render from.
export type LocalFilter = {
	value: FilterValue;
	onChange: (next: FilterValue) => void;
};

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
