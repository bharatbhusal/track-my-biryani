import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
	BucketFilterCriteria,
	FilterDatePreset,
	PaginationCriteria,
	SortCriteria,
	SortDirection,
} from "@/types/search.types";

type BucketsFilterState = {
	filterCriteria: BucketFilterCriteria;
	sortCriteria: SortCriteria;
	pagination: PaginationCriteria;
};

const initialState: BucketsFilterState = {
	filterCriteria: {
		datePreset: "THIS_MONTH",
	},
	sortCriteria: { field: "createdAt", direction: "DESC" },
	pagination: { page: 1, pageSize: 20 },
};

const bucketsFilterSlice = createSlice({
	name: "bucketsFilter",
	initialState,
	reducers: {
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
		clearDateFilter(state) {
			state.filterCriteria.datePreset = "THIS_MONTH";
			state.filterCriteria.customFrom = undefined;
			state.filterCriteria.customTo = undefined;
			state.pagination.page = 1;
		},
		clearSort(state) {
			state.sortCriteria = { field: "createdAt", direction: "DESC" };
			state.pagination.page = 1;
		},
		clearAllFilters() {
			return initialState;
		},
	},
});

export const {
	setDateFilter,
	setSort,
	setPage,
	clearDateFilter,
	clearSort,
	clearAllFilters,
} = bucketsFilterSlice.actions;
export default bucketsFilterSlice.reducer;
