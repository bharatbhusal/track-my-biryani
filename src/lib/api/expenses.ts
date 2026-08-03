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

function appendBucketId(
	url: string,
	bucketId?: string | null,
): string {
	if (!bucketId) return url;
	const sep = url.includes("?") ? "&" : "?";
	return `${url}${sep}bucketId=${encodeURIComponent(bucketId)}`;
}

export const expensesApi = {
	listCategories: (bucketId?: string | null) =>
		apiRequest<CategoryItem[]>(
			appendBucketId("/categories", bucketId),
		),
	createCategory: (
		payload: {
			name: string;
			color?: string;
			emoji?: string;
		},
		bucketId?: string | null,
	) =>
		apiRequest<CategoryItem>(
			appendBucketId("/categories", bucketId),
			{
				method: "POST",
				body: payload,
			},
		),
	updateCategory: (
		id: string,
		payload: { name: string; color?: string; emoji?: string },
		bucketId?: string | null,
	) =>
		apiRequest<CategoryItem>(
			appendBucketId(`/categories/${id}`, bucketId),
			{
				method: "PUT",
				body: payload,
			},
		),
	getCategoryById: (id: string, bucketId?: string | null) =>
		apiRequest<CategoryItem>(
			appendBucketId(`/categories/${id}`, bucketId),
		),
	deleteCategory: (
		id: string,
		bucketId?: string | null,
	) =>
		apiRequest<{ message: string }>(
			appendBucketId(`/categories/${id}`, bucketId),
			{
				method: "DELETE",
			},
		),
	getCategoryStats: (
		id: string,
		from: string,
		to: string,
		bucketId?: string | null,
	) =>
		apiRequest<CategoryRangeStats>(
			appendBucketId(
				`/categories/${id}/stats?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
				bucketId,
			),
		),
	getCategoryDistribution: (
		from: string,
		to: string,
		bucketId?: string | null,
	) =>
		apiRequest<CategoryBreakdownPoint[]>(
			appendBucketId(
				`/categories/distribution?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
				bucketId,
			),
		),
	listCategoriesWithStats: (
		from: string,
		to: string,
		bucketId?: string | null,
	) =>
		apiRequest<CategoryWithStats[]>(
			appendBucketId(
				`/categories/stats?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
				bucketId,
			),
		),
	listExpenses: (filters: ExpenseListQuery = {}) => {
		const query = buildListQuery(filters);
		return apiRequest<ExpensesListPayload>(
			`/expenses${query ? `?${query}` : ""}`,
		);
	},
	getExpenseById: (id: string, bucketId?: string | null) =>
		apiRequest<ExpenseItem>(
			appendBucketId(`/expenses/${id}`, bucketId),
		),
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
		return apiRequest<ExpenseContribution>(
			appendBucketId(url, bucketId),
		);
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
	deleteExpense: (id: string, bucketId?: string | null) =>
		apiRequest<{ message: string }>(
			appendBucketId(`/expenses/${id}`, bucketId),
			{
				method: "DELETE",
			},
		),
	getOverviewStats: (
		from: string,
		to: string,
		bucketId?: string | null,
	) =>
		apiRequest<DashboardCard[]>(
			appendBucketId(
				`/expenses/overview?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
				bucketId,
			),
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
			appendBucketId(
				`/expenses/chart?${params.toString()}`,
				bucketId,
			),
		);
	},
};
