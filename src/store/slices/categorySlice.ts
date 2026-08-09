import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { expensesApi } from "@/lib/api/expenses";
import type { CategoryItem } from "@/types/expense.types";
import type {
	CategoryBreakdownPoint,
	CategoryRangeStats,
	CategoryWithStats,
} from "@/types/analytics.types";
import {
	categoryCriteria,
} from "@/lib/filters";
import { sortForVariant } from "@/components/filters/variants";
import type { ExpenseFilterCriteria } from "@/types/search.types";
import type { RootState } from "@/store";

type CategoryState = {
	items: CategoryItem[];
	itemsWithStats: CategoryWithStats[];
	currentCategory: CategoryItem | null;
	stats: CategoryRangeStats | null;
	distribution: CategoryBreakdownPoint[];
	loading: boolean;
	error: string | null;
};

const initialState: CategoryState = {
	items: [],
	itemsWithStats: [],
	currentCategory: null,
	stats: null,
	distribution: [],
	loading: false,
	error: null,
};

export const fetchCategories = createAsyncThunk(
	"categories/search",
	async (_: void, { getState }) => {
		const state = getState() as RootState;
		const result = await expensesApi.searchCategories({
			filterCriteria: categoryCriteria(state.filters.filterCriteria),
			sortCriteria: sortForVariant(
				"categories",
				state.filters.sortCriteria,
			),
			pagination: state.filters.pagination,
		});
		return result.items;
	},
);

export const fetchCategoriesWithStats = createAsyncThunk(
	"categories/fetchListWithStats",
	async (filterCriteria: ExpenseFilterCriteria) => {
		return expensesApi.listCategoriesWithStats(
			categoryCriteria(filterCriteria),
		);
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
	async ({ id, from, to }: { id: string; from: string; to: string }) => {
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
		{ dispatch },
	) => {
		const category = await expensesApi.createCategory(payload);
		dispatch(fetchCategories());
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
		payload: { name: string; color?: string; emoji?: string; bucketId?: string };
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
		return expensesApi.getCategoryDistribution(filterCriteria);
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
			// fetchCategories
			.addCase(fetchCategories.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchCategories.fulfilled, (state, action) => {
				state.loading = false;
				state.items = action.payload;
			})
			.addCase(fetchCategories.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message ?? "Failed to fetch categories";
			})
			// fetchCategoriesWithStats
			.addCase(fetchCategoriesWithStats.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchCategoriesWithStats.fulfilled, (state, action) => {
				state.loading = false;
				state.itemsWithStats = action.payload;
			})
			.addCase(fetchCategoriesWithStats.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message ?? "Failed to fetch categories with stats";
			})
			// fetchCategoryDetail
			.addCase(fetchCategoryDetail.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchCategoryDetail.fulfilled, (state, action) => {
				state.loading = false;
				state.currentCategory = action.payload;
			})
			.addCase(fetchCategoryDetail.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message ?? "Failed to fetch category";
			})
			// fetchCategoryStats
			.addCase(fetchCategoryStats.fulfilled, (state, action) => {
				state.stats = action.payload;
			})
			// createCategory
			.addCase(createCategory.rejected, (state, action) => {
				state.error =
					action.error.message ?? "Failed to create category";
			})
			// updateCategory
			.addCase(updateCategory.fulfilled, (state, action) => {
				const idx = state.items.findIndex(
					(c) => c._id === action.payload._id,
				);
				if (idx !== -1) state.items[idx] = action.payload;
				if (state.currentCategory?._id === action.payload._id) {
					state.currentCategory = action.payload;
				}
			})
			// deleteCategory
			.addCase(deleteCategory.fulfilled, (state, action) => {
				const deletedId = action.meta.arg;
				state.items = state.items.filter(
					(c) => c._id !== deletedId,
				);
				if (state.currentCategory?._id === deletedId) {
					state.currentCategory = null;
				}
			})
			// fetchCategoryDistribution
			.addCase(fetchCategoryDistribution.fulfilled, (state, action) => {
				state.distribution = action.payload;
			});
	},
});

export const { clearCategoryError, resetCategoryDetail } =
	categorySlice.actions;
export default categorySlice.reducer;
