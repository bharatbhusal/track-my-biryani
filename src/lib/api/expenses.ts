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
			key === "bucketId" ||
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
	listCategories: (bucketId?: string | null) =>
		apiRequest<CategoryItem[]>("/categories", { bucketId }),
	createCategory: (
		payload: {
			name: string;
			color?: string;
			emoji?: string;
		},
		bucketId?: string | null,
	) =>
		apiRequest<CategoryItem>("/categories", {
			method: "POST",
			body: payload,
			bucketId,
		}),
	updateCategory: (
		id: string,
		payload: { name: string; color?: string; emoji?: string; bucketId?: string },
		bucketId?: string | null,
	) =>
		apiRequest<CategoryItem>(`/categories/${id}`, {
			method: "PUT",
			body: payload,
			bucketId,
		}),
	getCategoryById: (id: string, bucketId?: string | null) =>
		apiRequest<CategoryItem>(`/categories/${id}`, { bucketId }),
	deleteCategory: (
		id: string,
		bucketId?: string | null,
	) =>
		apiRequest<{ message: string }>(`/categories/${id}`, {
			method: "DELETE",
			bucketId,
		}),
	getCategoryStats: (
		id: string,
		from: string,
		to: string,
		bucketId?: string | null,
	) =>
		apiRequest<CategoryRangeStats>(
			`/categories/${id}/stats?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
			{ bucketId },
		),
	getCategoryDistribution: (
		from: string,
		to: string,
		bucketId?: string | null,
	) =>
		apiRequest<CategoryBreakdownPoint[]>(
			`/categories/distribution?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
			{ bucketId },
		),
	listCategoriesWithStats: (
		from: string,
		to: string,
		bucketId?: string | null,
	) =>
		apiRequest<CategoryWithStats[]>(
			`/categories/stats?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
			{ bucketId },
		),
	listExpenses: (filters: ExpenseListQuery = {}) => {
		const query = buildListQuery(filters);
		return apiRequest<ExpensesListPayload>(
			`/expenses${query ? `?${query}` : ""}`,
			{ bucketId: filters.bucketId ?? undefined },
		);
	},
	getExpenseById: (id: string, bucketId?: string | null) =>
		apiRequest<ExpenseItem>(`/expenses/${id}`, { bucketId }),
	getExpenseContribution: (
		id: string,
		from?: string,
		to?: string,
		bucketId?: string | null,
	) => {
		let url = `/expenses/${encodeURIComponent(id)}/contribution`;
		const params = new URLSearchParams();
		if (from) params.set("from", from);
		if (to) params.set("to", to);
		const qs = params.toString();
		if (qs) url += `?${qs}`;
		return apiRequest<ExpenseContribution>(url, { bucketId });
	},
	createExpense: (payload: CreateExpensePayload) =>
		apiRequest<ExpenseItem>("/expenses", {
			method: "POST",
			body: payload,
			bucketId: payload.bucketId ?? undefined,
		}),
	updateExpense: (
		id: string,
		payload: Partial<CreateExpensePayload>,
	) =>
		apiRequest<ExpenseItem>(`/expenses/${id}`, {
			method: "PUT",
			body: payload,
			bucketId: payload.bucketId ?? undefined,
		}),
	deleteExpense: (id: string, bucketId?: string | null) =>
		apiRequest<{ message: string }>(`/expenses/${id}`, {
			method: "DELETE",
			bucketId,
		}),
	getOverviewStats: (
		from: string,
		to: string,
		bucketId?: string | null,
	) =>
		apiRequest<DashboardCard[]>(
			`/expenses/overview?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
			{ bucketId },
		),
	getChartData: (
		from: string,
		to: string,
		categoryId?: string,
		bucketId?: string | null,
	) => {
		const params = new URLSearchParams({ from, to });
		if (categoryId) params.set("categoryId", categoryId);
		return apiRequest<ChartData>(
			`/expenses/chart?${params.toString()}`,
			{ bucketId },
		);
	},
};
