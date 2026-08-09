import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
	AuditFilterCriteria,
	BucketPreset,
	FilterDatePreset,
	OwnerPreset,
	PaginationCriteria,
	SortCriteria,
	SortDirection,
} from "@/types/search.types";

type LogsFilterState = {
	filterCriteria: AuditFilterCriteria;
	sortCriteria: SortCriteria;
	pagination: PaginationCriteria;
};

const initialState: LogsFilterState = {
	filterCriteria: {
		bucketPreset: "ALL",
		bucketIds: [],
		ownerPreset: "ALL",
		ownerIds: [],
		datePreset: "THIS_MONTH",
	},
	sortCriteria: { field: "timestamp", direction: "DESC" },
	pagination: { page: 1, pageSize: 30 },
};

const logsFilterSlice = createSlice({
	name: "logsFilter",
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
		clearBucketFilter(state) {
			state.filterCriteria.bucketPreset = "ALL";
			state.filterCriteria.bucketIds = [];
			state.pagination.page = 1;
		},
		clearOwnerFilter(state) {
			state.filterCriteria.ownerPreset = "ALL";
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
			state.sortCriteria = { field: "timestamp", direction: "DESC" };
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
	clearBucketFilter,
	clearOwnerFilter,
	clearDateFilter,
	clearSort,
	clearAllFilters,
} = logsFilterSlice.actions;
export default logsFilterSlice.reducer;
