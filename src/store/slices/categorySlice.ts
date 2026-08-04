import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { expensesApi } from "@/lib/api/expenses";
import type { CategoryItem } from "@/types/expense.types";
import type { CategoryRangeStats, CategoryBreakdownPoint, CategoryWithStats } from "@/types/analytics.types";

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
	"categories/fetchList",
	async (bucketId?: string | null) => {
		return expensesApi.listCategories(bucketId);
	},
);

export const fetchCategoriesWithStats = createAsyncThunk(
	"categories/fetchListWithStats",
	async ({
		from,
		to,
		bucketId,
	}: {
		from: string;
		to: string;
		bucketId?: string | null;
	}) => {
		return expensesApi.listCategoriesWithStats(
			from,
			to,
			bucketId,
		);
	},
);

export const fetchCategoryDetail = createAsyncThunk(
	"categories/fetchDetail",
	async ({
		id,
		bucketId,
	}: {
		id: string;
		bucketId?: string | null;
	}) => {
		return expensesApi.getCategoryById(id, bucketId);
	},
);

export const fetchCategoryStats = createAsyncThunk(
	"categories/fetchStats",
	async ({
		id,
		from,
		to,
		bucketId,
	}: {
		id: string;
		from: string;
		to: string;
		bucketId?: string | null;
	}) => {
		return expensesApi.getCategoryStats(
			id,
			from,
			to,
			bucketId,
		);
	},
);

export const createCategory = createAsyncThunk(
	"categories/create",
	async ({
		payload,
		bucketId,
	}: {
		payload: {
			name: string;
			color?: string;
			emoji?: string;
		};
		bucketId?: string | null;
	}) => {
		return expensesApi.createCategory(payload, bucketId);
	},
);

export const updateCategory = createAsyncThunk(
	"categories/update",
	async ({
		id,
		payload,
		bucketId,
	}: {
		id: string;
		payload: { name: string; color?: string; emoji?: string; bucketId?: string };
		bucketId?: string | null;
	}) => {
		return expensesApi.updateCategory(id, payload, bucketId);
	},
);

export const deleteCategory = createAsyncThunk(
	"categories/delete",
	async ({
		id,
		bucketId,
	}: {
		id: string;
		bucketId?: string | null;
	}) => {
		return expensesApi.deleteCategory(id, bucketId);
	},
);

export const fetchCategoryDistribution = createAsyncThunk(
	"categories/fetchDistribution",
	async ({
		from,
		to,
		bucketId,
	}: {
		from: string;
		to: string;
		bucketId?: string | null;
	}) => {
		return expensesApi.getCategoryDistribution(
			from,
			to,
			bucketId,
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
			.addCase(createCategory.fulfilled, (state, action) => {
				state.items.push(action.payload);
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
				const deletedId = action.meta.arg.id;
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
