import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { expensesApi } from "@/lib/api/expenses";
import { toIsoBounds } from "@/lib/date-range";
import type { ExpenseItem, CategoryItem } from "@/types/expense.types";
import type { GlobalDateRange } from "@/lib/date-range";

type DashboardState = {
	expenses: ExpenseItem[];
	categories: CategoryItem[];
	loading: boolean;
	error: string | null;
};

const initialState: DashboardState = {
	expenses: [],
	categories: [],
	loading: false,
	error: null,
};

export const fetchDashboardData = createAsyncThunk(
	"dashboard/fetchData",
	async (range: GlobalDateRange) => {
		const { from, to } = toIsoBounds(range);
		if (!from || !to) {
			return { expenses: [], categories: [] };
		}
		const [expenses, categories] = await Promise.all([
			expensesApi.allInRange(from, to),
			expensesApi.listCategories(),
		]);
		return { expenses, categories };
	},
);

const dashboardSlice = createSlice({
	name: "dashboard",
	initialState,
	reducers: {
		clearDashboardError(state) {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchDashboardData.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchDashboardData.fulfilled, (state, action) => {
				state.loading = false;
				state.expenses = action.payload.expenses;
				state.categories = action.payload.categories;
			})
			.addCase(fetchDashboardData.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message ?? "Failed to fetch dashboard";
			});
	},
});

export const { clearDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
