import { apiRequest } from "@/lib/api/client";
import type {
	CategoryItem,
	CreateExpensePayload,
	ExpenseItem,
	ExpenseListQuery,
	ExpensesListPayload,
} from "@/types/expense.types";
import type {
	ExpenseContribution,
	CategoryRangeStats,
	CategoryBreakdownPoint,
	ChartData,
	DashboardCard,
	CategoryWithStats,
} from "@/types/analytics.types";

function buildListQuery(filters: ExpenseListQuery): string {
	const params = new URLSearchParams();

	Object.entries(filters).forEach(([key, value]) => {
		if (
			value === undefined ||
			value === null ||
			value === ""
		) {
			return;
		}

		params.set(key, String(value));
	});

	return params.toString();
}

export const expensesApi = {
	listCategories: () =>
		apiRequest<CategoryItem[]>("/categories"),
	createCategory: (payload: {
		name: string;
		color?: string;
		emoji?: string;
	}) =>
		apiRequest<CategoryItem>("/categories", {
			method: "POST",
			body: payload,
		}),
	updateCategory: (
		id: string,
		payload: { name: string; color?: string; emoji?: string },
	) =>
		apiRequest<CategoryItem>(`/categories/${id}`, {
			method: "PUT",
			body: payload,
		}),
	getCategoryById: (id: string) =>
		apiRequest<CategoryItem>(`/categories/${id}`),
	deleteCategory: (id: string) =>
		apiRequest<{ message: string }>(`/categories/${id}`, {
			method: "DELETE",
		}),
	getCategoryStats: (id: string, from: string, to: string) =>
		apiRequest<CategoryRangeStats>(
			`/categories/${id}/stats?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
		),
	getCategoryDistribution: (from: string, to: string) =>
		apiRequest<CategoryBreakdownPoint[]>(
			`/categories/distribution?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
		),
	listCategoriesWithStats: (from: string, to: string) =>
		apiRequest<CategoryWithStats[]>(
			`/categories/stats?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
		),
	listExpenses: (filters: ExpenseListQuery = {}) => {
		const query = buildListQuery(filters);
		return apiRequest<ExpensesListPayload>(
			`/expenses${query ? `?${query}` : ""}`,
		);
	},
	getExpenseById: (id: string) =>
		apiRequest<ExpenseItem>(`/expenses/${id}`),
	getExpenseContribution: (
		id: string,
		from?: string,
		to?: string,
	) => {
		let url = `/expenses/${encodeURIComponent(id)}/contribution`;
		const params = new URLSearchParams();
		if (from) params.set("from", from);
		if (to) params.set("to", to);
		const qs = params.toString();
		if (qs) url += `?${qs}`;
		return apiRequest<ExpenseContribution>(url);
	},
	createExpense: (payload: CreateExpensePayload) =>
		apiRequest<ExpenseItem>("/expenses", {
			method: "POST",
			body: payload,
		}),
	updateExpense: (
		id: string,
		payload: Partial<CreateExpensePayload>,
	) =>
		apiRequest<ExpenseItem>(`/expenses/${id}`, {
			method: "PUT",
			body: payload,
		}),
	deleteExpense: (id: string) =>
		apiRequest<{ message: string }>(`/expenses/${id}`, {
			method: "DELETE",
		}),
	getOverviewStats: (from: string, to: string) =>
		apiRequest<DashboardCard[]>(
			`/expenses/overview?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
		),
	getChartData: (
		from: string,
		to: string,
		categoryId?: string,
	) => {
		const params = new URLSearchParams({ from, to });
		if (categoryId) params.set("categoryId", categoryId);
		return apiRequest<ChartData>(
			`/expenses/chart?${params.toString()}`,
		);
	},
};
