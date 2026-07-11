import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { expensesApi } from "@/lib/api/expenses";
import type {
	ExpenseItem,
	ExpenseListQuery,
	ExpensesListPayload,
	CreateExpensePayload,
} from "@/types/expense.types";
import type { ExpenseContribution } from "@/types/analytics.types";

type ExpenseState = {
	items: ExpenseItem[];
	currentExpense: ExpenseItem | null;
	contribution: ExpenseContribution | null;
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
	total: 0,
	totalPages: 0,
	currentPage: 1,
	loading: false,
	error: null,
};

export const fetchExpenses = createAsyncThunk(
	"expenses/fetchList",
	async (filters: ExpenseListQuery = {}) => {
		return expensesApi.listExpenses(filters);
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
				const data = action.payload as ExpensesListPayload;
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
			// fetchExpenseDetail
			.addCase(fetchExpenseDetail.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchExpenseDetail.fulfilled, (state, action) => {
				state.loading = false;
				state.currentExpense = action.payload;
			})
			.addCase(fetchExpenseDetail.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message ?? "Failed to fetch expense";
			})
			// fetchExpenseContribution
			.addCase(fetchExpenseContribution.fulfilled, (state, action) => {
				state.contribution = action.payload;
			})
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
				state.items = state.items.filter(
					(e) => e._id !== action.meta.arg,
				);
				state.total = Math.max(0, state.total - 1);
				if (state.currentExpense?._id === action.meta.arg) {
					state.currentExpense = null;
				}
			});
	},
});

export const { clearExpenseError, resetExpenseDetail } =
	expenseSlice.actions;
export default expenseSlice.reducer;
