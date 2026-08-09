import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
	BucketPreset,
	CategoryFilterCriteria,
	FilterDatePreset,
	OwnerPreset,
	PaginationCriteria,
	SortCriteria,
	SortDirection,
} from "@/types/search.types";

type CategoriesFilterState = {
	filterCriteria: CategoryFilterCriteria;
	sortCriteria: SortCriteria;
	pagination: PaginationCriteria;
};

const initialState: CategoriesFilterState = {
	filterCriteria: {
		bucketPreset: "PERSONAL",
		bucketIds: [],
		ownerPreset: "ME",
		ownerIds: [],
		datePreset: "THIS_MONTH",
	},
	sortCriteria: { field: "amount", direction: "DESC" },
	pagination: { page: 1, pageSize: 20 },
};

const categoriesFilterSlice = createSlice({
	name: "categoriesFilter",
	initialState,
	reducers: {
		setBucketFilter(
			state,
			action: PayloadAction<{ preset: BucketPreset; ids: string[] }>,
		) {
			state.filterCriteria.bucketPreset = action.payload.preset;
			state.filterCriteria.bucketIds = action.payload.ids;
			state.pagination.page = 1;
		},
		setOwnerFilter(
			state,
			action: PayloadAction<{ preset: OwnerPreset; ids: string[] }>,
		) {
			state.filterCriteria.ownerPreset = action.payload.preset;
			state.filterCriteria.ownerIds = action.payload.ids;
			state.pagination.page = 1;
		},
		setDateFilter(
			state,
			action: PayloadAction<{
				preset: FilterDatePreset;
				customFrom?: string;
				customTo?: string;
			}>,
		) {
			state.filterCriteria.datePreset = action.payload.preset;
			state.filterCriteria.customFrom = action.payload.customFrom;
			state.filterCriteria.customTo = action.payload.customTo;
			state.pagination.page = 1;
		},
		setSort(
			state,
			action: PayloadAction<{ field: string; direction: SortDirection }>,
		) {
			state.sortCriteria = action.payload;
			state.pagination.page = 1;
		},
		setPage(state, action: PayloadAction<number>) {
			state.pagination.page = action.payload;
		},
		setSearch(state, action: PayloadAction<string | undefined>) {
			state.filterCriteria.q = action.payload;
			state.pagination.page = 1;
		},
		clearBucketFilter(state) {
			state.filterCriteria.bucketPreset = "PERSONAL";
			state.filterCriteria.bucketIds = [];
			state.pagination.page = 1;
		},
		clearOwnerFilter(state) {
			state.filterCriteria.ownerPreset = "ME";
			state.filterCriteria.ownerIds = [];
			state.pagination.page = 1;
		},
		clearDateFilter(state) {
			state.filterCriteria.datePreset = "THIS_MONTH";
			state.filterCriteria.customFrom = undefined;
			state.filterCriteria.customTo = undefined;
			state.pagination.page = 1;
		},
		clearSort(state) {
			state.sortCriteria = { field: "amount", direction: "DESC" };
			state.pagination.page = 1;
		},
		clearAllFilters() {
			return initialState;
		},
	},
});

export const {
	setBucketFilter,
	setOwnerFilter,
	setDateFilter,
	setSort,
	setPage,
	setSearch,
	clearBucketFilter,
	clearOwnerFilter,
	clearDateFilter,
	clearSort,
	clearAllFilters,
} = categoriesFilterSlice.actions;
export default categoriesFilterSlice.reducer;
