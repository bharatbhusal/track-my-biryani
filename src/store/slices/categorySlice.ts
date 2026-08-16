import {
	createSlice,
	createAsyncThunk,
} from "@reduxjs/toolkit";
import { expensesApi } from "@/lib/api/expenses";
import type {
	CategoryBreakdownPoint,
	CategoryRangeStats,
	CategoryItem as CategoryItemAanlytics,
	CategoryWithStats,
} from "@/types/analytics.types";
import type {
	CategoryFilterCriteria,
	ExpenseFilterCriteria,
	SortCriteria,
} from "@/types/search.types";
import type { RootState } from "@/store";

type CategoryState = {
	itemsWithStats: CategoryWithStats | null;
	currentCategory: CategoryItemAanlytics | null;
	stats: CategoryRangeStats | null;
	distribution: CategoryBreakdownPoint[];
	loading: boolean;
	error: string | null;
};

const initialState: CategoryState = {
	itemsWithStats: null,
	currentCategory: null,
	stats: null,
	distribution: [],
	loading: false,
	error: null,
};

export const fetchCategoriesWithStats = createAsyncThunk(
	"categories/fetchListWithStats",
	async ({
		filterCriteria,
		sortCriteria,
	}: {
		filterCriteria: CategoryFilterCriteria;
		sortCriteria: SortCriteria;
	}) => {
		return expensesApi.listCategoriesWithStats({
			filterCriteria,
			sortCriteria,
		});
	},
);

export const fetchCategoryDetail = createAsyncThunk(
	"categories/fetchDetail",
	async (id: string) => {
		return expensesApi.getCategoryById(id);
	},
);

export const fetchCategoryStats = createAsyncThunk(
	"categories/fetchStats",
	async ({
		id,
		from,
		to,
	}: {
		id: string;
		from: string;
		to: string;
	}) => {
		return expensesApi.getCategoryStats(id, from, to);
	},
);

export const createCategory = createAsyncThunk(
	"categories/create",
	async (
		payload: {
			name: string;
			color?: string;
			emoji?: string;
			bucketId?: string;
		},
		{ dispatch, getState },
	) => {
		const state = getState() as RootState;
		const category =
			await expensesApi.createCategory(payload);
		dispatch(
			fetchCategoriesWithStats({
				filterCriteria: state.filters.filterCriteria,
				sortCriteria: state.filters.sortCriteria,
			}),
		);
		return category;
	},
);

export const updateCategory = createAsyncThunk(
	"categories/update",
	async ({
		id,
		payload,
	}: {
		id: string;
		payload: {
			name: string;
			color?: string;
			emoji?: string;
			bucketId?: string;
		};
	}) => {
		return expensesApi.updateCategory(id, payload);
	},
);

export const deleteCategory = createAsyncThunk(
	"categories/delete",
	async (id: string) => {
		return expensesApi.deleteCategory(id);
	},
);

export const fetchCategoryDistribution = createAsyncThunk(
	"categories/fetchDistribution",
	async (filterCriteria: ExpenseFilterCriteria) => {
		return expensesApi.getCategoryDistribution(
			filterCriteria,
		);
	},
);

const categorySlice = createSlice({
	name: "categories",
	initialState,
	reducers: {
		clearCategoryError(state) {
			state.error = null;
		},
		resetCategoryDetail(state) {
			state.currentCategory = null;
			state.stats = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// fetchCategoriesWithStats
			.addCase(fetchCategoriesWithStats.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(
				fetchCategoriesWithStats.fulfilled,
				(state, action) => {
					state.loading = false;
					const payload = action.payload ?? {
						items: [],
						stats: {},
					};
					state.itemsWithStats = {
						...payload,
						stats: {
							...payload.stats,
							total: payload.stats?.total ?? 0,
							count: payload.stats?.count ?? 0,
							expenseCount: payload.stats?.expenseCount ?? 0,
							min: payload.stats?.min ?? 0,
							max: payload.stats?.max ?? 0,
							avg: payload.stats?.avg ?? 0,
						},
					};
				},
			)
			.addCase(
				fetchCategoriesWithStats.rejected,
				(state, action) => {
					state.loading = false;
					state.error =
						action.error.message ??
						"Failed to fetch categories with stats";
				},
			)
			// fetchCategoryDetail
			.addCase(fetchCategoryDetail.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(
				fetchCategoryDetail.fulfilled,
				(state, action) => {
					state.loading = false;
					state.currentCategory = action.payload;
				},
			)
			.addCase(
				fetchCategoryDetail.rejected,
				(state, action) => {
					state.loading = false;
					state.error =
						action.error.message ?? "Failed to fetch category";
				},
			)
			// fetchCategoryStats
			.addCase(
				fetchCategoryStats.fulfilled,
				(state, action) => {
					state.stats = action.payload;
				},
			)
			// createCategory
			.addCase(createCategory.rejected, (state, action) => {
				state.error =
					action.error.message ?? "Failed to create category";
			})
			// fetchCategoryDistribution
			.addCase(
				fetchCategoryDistribution.fulfilled,
				(state, action) => {
					state.distribution = action.payload;
				},
			);
	},
});

export const { clearCategoryError, resetCategoryDetail } =
	categorySlice.actions;
export default categorySlice.reducer;
