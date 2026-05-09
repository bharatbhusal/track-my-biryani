import { apiRequest } from "@/lib/api/client";
import type {
	CategoryItem,
	CreateExpensePayload,
	ExpenseItem,
	ExpenseListQuery,
	ExpensesListPayload,
} from "@/types/expense.types";
import type { ExpenseContribution } from "@/types/analytics.types";

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
	createCategory: (name: string) =>
		apiRequest<CategoryItem>("/categories", {
			method: "POST",
			body: { name },
		}),
	updateCategory: (
		id: string,
		payload: { name: string; color?: string },
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
	listExpenses: (filters: ExpenseListQuery = {}) => {
		const query = buildListQuery({
			page: 1,
			limit: 20,
			...filters,
		});
		return apiRequest<ExpensesListPayload>(
			`/expenses${query ? `?${query}` : ""}`,
		);
	},
	getExpenseById: (id: string) =>
		apiRequest<ExpenseItem>(`/expenses/${id}`),
	getExpenseContribution: (id: string) =>
		apiRequest<ExpenseContribution>(
			`/expenses/${encodeURIComponent(id)}/contribution`,
		),
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
};
