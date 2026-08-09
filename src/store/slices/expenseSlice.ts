import {
	createSlice,
	createAsyncThunk,
} from "@reduxjs/toolkit";
import { expensesApi } from "@/lib/api/expenses";
import type {
	ExpenseItem,
	CreateExpensePayload,
} from "@/types/expense.types";
import type {
	ExpenseContribution,
	ChartData,
	DashboardCard,
} from "@/types/analytics.types";
import type { GlobalDateRange } from "@/lib/date-range";
import { toIsoBounds } from "@/lib/date-range";
import { sortForVariant } from "@/components/filters/variants";
import type { RootState } from "@/store";

type ExpenseState = {
	items: ExpenseItem[];
	currentExpense: ExpenseItem | null;
	contribution: ExpenseContribution | null;
	overviewStats: DashboardCard[] | null;
	chartData: ChartData | null;
	total: number;
	totalPages: number;
	currentPage: number;
	loading: boolean;
	error: string | null;
};

const initialState: ExpenseState = {
	items: [],
	currentExpense: null,
	contribution: null,
	overviewStats: null,
	chartData: null,
	total: 0,
	totalPages: 0,
	currentPage: 1,
	loading: false,
	error: null,
};

export const fetchExpenses = createAsyncThunk(
	"expenses/search",
	async (_: void, { getState }) => {
		const state = getState() as RootState;
		return expensesApi.searchExpenses({
			filterCriteria: state.filters.filterCriteria,
			sortCriteria: sortForVariant(
				"expenses",
				state.filters.sortCriteria,
			),
			pagination: state.filters.pagination,
		});
	},
);

export const fetchExpensesInRange = createAsyncThunk(
	"expenses/fetchInRange",
	async (range: GlobalDateRange, { getState }) => {
		const state = getState() as RootState;
		const { from, to } = toIsoBounds(range);
		if (!from || !to) {
			return {
				items: [],
				total: 0,
				page: null,
				totalPages: null,
			};
		}
		return expensesApi.searchExpenses({
			filterCriteria: {
				...state.filters.filterCriteria,
				datePreset: "CUSTOM",
				customFrom: from,
				customTo: to,
			},
			sortCriteria: sortForVariant(
				"expenses",
				state.filters.sortCriteria,
			),
			pagination: { page: 1, pageSize: state.filters.pagination.pageSize },
		});
	},
);

export const fetchExpenseDetail = createAsyncThunk(
	"expenses/fetchDetail",
	async (id: string) => {
		return expensesApi.getExpenseById(id);
	},
);

export const fetchExpenseContribution = createAsyncThunk(
	"expenses/fetchContribution",
	async ({
		id,
		from,
		to,
	}: {
		id: string;
		from?: string;
		to?: string;
	}) => {
		return expensesApi.getExpenseContribution(id, from, to);
	},
);

export const createExpense = createAsyncThunk(
	"expenses/create",
	async (payload: CreateExpensePayload) => {
		return expensesApi.createExpense(payload);
	},
);

export const updateExpense = createAsyncThunk(
	"expenses/update",
	async ({
		id,
		payload,
	}: {
		id: string;
		payload: Partial<CreateExpensePayload>;
	}) => {
		return expensesApi.updateExpense(id, payload);
	},
);

export const deleteExpense = createAsyncThunk(
	"expenses/delete",
	async (id: string) => {
		return expensesApi.deleteExpense(id);
	},
);

export const fetchOverviewStats = createAsyncThunk(
	"expenses/fetchOverviewStats",
	async ({ from, to }: { from: string; to: string }) => {
		return expensesApi.getOverviewStats({ from, to });
	},
);

export const fetchChartData = createAsyncThunk(
	"expenses/fetchChartData",
	async (
		{
			from,
			to,
			categoryIds,
		}: {
			from: string;
			to: string;
			categoryIds?: string[];
		},
		{ getState },
	) => {
		const data = await expensesApi.getChartData({ from, to });
		if (!categoryIds || categoryIds.length === 0) return data;

		// ponytail: backend chart endpoint only takes a single categoryId, so
		// fetch the full set and narrow to the selected categories client-side.
		const categories = (getState() as RootState).categories.items;
		const names = new Set(
			categories
				.filter((c) => categoryIds.includes(c._id))
				.map((c) => c.name),
		);
		if (names.size === 0) return data;

		return {
			series: data.series.map((point) => {
				const filtered: Record<string, string | number> = { name: point.name };
				for (const [key, val] of Object.entries(point)) {
					if (key !== "name" && names.has(key)) filtered[key] = val;
				}
				return filtered;
			}),
			categoryColors: Object.fromEntries(
				Object.entries(data.categoryColors).filter(([name]) => names.has(name)),
			),
		};
	},
);

const expenseSlice = createSlice({
	name: "expenses",
	initialState,
	reducers: {
		clearExpenseError(state) {
			state.error = null;
		},
		resetExpenseDetail(state) {
			state.currentExpense = null;
			state.contribution = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// fetchExpenses
			.addCase(fetchExpenses.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchExpenses.fulfilled, (state, action) => {
				state.loading = false;
				const data = action.payload;
				state.items = data.items ?? [];
				state.total = data.total ?? 0;
				state.totalPages = data.totalPages ?? 0;
				state.currentPage = data.page ?? 1;
			})
			.addCase(fetchExpenses.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message ?? "Failed to fetch expenses";
			})
			// fetchExpensesInRange
			.addCase(fetchExpensesInRange.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(
				fetchExpensesInRange.fulfilled,
				(state, action) => {
					state.loading = false;
					const data = action.payload;
					state.items = data.items ?? [];
					state.total = data.total ?? 0;
					state.totalPages = data.totalPages ?? 0;
					state.currentPage = data.page ?? 1;
				},
			)
			.addCase(
				fetchExpensesInRange.rejected,
				(state, action) => {
					state.loading = false;
					state.error =
						action.error.message ?? "Failed to fetch expenses";
				},
			)
			// fetchExpenseDetail
			.addCase(fetchExpenseDetail.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(
				fetchExpenseDetail.fulfilled,
				(state, action) => {
					state.loading = false;
					state.currentExpense = action.payload;
				},
			)
			.addCase(
				fetchExpenseDetail.rejected,
				(state, action) => {
					state.loading = false;
					state.error =
						action.error.message ?? "Failed to fetch expense";
				},
			)
			// fetchExpenseContribution
			.addCase(
				fetchExpenseContribution.fulfilled,
				(state, action) => {
					state.contribution = action.payload;
				},
			)
			// createExpense
			.addCase(createExpense.fulfilled, (state, action) => {
				state.items.unshift(action.payload);
				state.total += 1;
			})
			// updateExpense
			.addCase(updateExpense.fulfilled, (state, action) => {
				const idx = state.items.findIndex(
					(e) => e._id === action.payload._id,
				);
				if (idx !== -1) state.items[idx] = action.payload;
				if (state.currentExpense?._id === action.payload._id) {
					state.currentExpense = action.payload;
				}
			})
			// deleteExpense
			.addCase(deleteExpense.fulfilled, (state, action) => {
				const id = action.meta.arg;
				state.items = state.items.filter((e) => e._id !== id);
				state.total = Math.max(0, state.total - 1);
				if (state.currentExpense?._id === id) {
					state.currentExpense = null;
				}
			})
			// fetchOverviewStats
			.addCase(
				fetchOverviewStats.fulfilled,
				(state, action) => {
					state.overviewStats = action.payload;
				},
			)
			// fetchChartData
			.addCase(fetchChartData.fulfilled, (state, action) => {
				state.chartData = action.payload;
			});
	},
});

export const { clearExpenseError, resetExpenseDetail } =
	expenseSlice.actions;
export default expenseSlice.reducer;
