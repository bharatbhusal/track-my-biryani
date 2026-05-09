import { apiRequest } from '@/lib/api/client';
import type { CategoryItem, CreateExpensePayload, ExpenseItem, ExpensesListPayload } from '@/types/expense.types';

export const expensesApi = {
  listCategories: () => apiRequest<CategoryItem[]>('/categories'),
  createCategory: (name: string) => apiRequest<CategoryItem>('/categories', { method: 'POST', body: { name } }),
  deleteCategory: (id: string) => apiRequest<{ message: string }>(`/categories/${id}`, { method: 'DELETE' }),
  listExpenses: (page = 1, limit = 20) => apiRequest<ExpensesListPayload>(`/expenses?page=${page}&limit=${limit}`),
  createExpense: (payload: CreateExpensePayload) => apiRequest<ExpenseItem>('/expenses', { method: 'POST', body: payload }),
};
