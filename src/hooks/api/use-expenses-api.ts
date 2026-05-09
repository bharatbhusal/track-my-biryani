"use client";

import {
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";

import { expensesApi } from "@/lib/api/expenses";
import { queryKeys } from "@/lib/api/query-keys";
import type {
	ExpenseItem,
	ExpenseListQuery,
	ExpensesListPayload,
} from "@/types/expense.types";

export function useCategoriesQuery() {
	return useQuery({
		queryKey: queryKeys.categories,
		queryFn: expensesApi.listCategories,
	});
}

export function useExpensesQuery(
	filters: ExpenseListQuery = {},
) {
	const mergedFilters = { page: 1, limit: 20, ...filters };

	return useQuery({
		queryKey: queryKeys.expenses.list(mergedFilters),
		queryFn: () => expensesApi.listExpenses(mergedFilters),
	});
}

export function useExpenseDetailQuery(id: string) {
	return useQuery({
		queryKey: queryKeys.expenses.detail(id),
		queryFn: () => expensesApi.getExpenseById(id),
		enabled: Boolean(id),
	});
}

export function useCategoryDetailQuery(id: string) {
	return useQuery({
		queryKey: [...queryKeys.categories, "detail", id],
		queryFn: () => expensesApi.getCategoryById(id),
		enabled: Boolean(id),
	});
}

export function useExpenseMutations() {
	const queryClient = useQueryClient();

	const createExpense = useMutation({
		mutationFn: expensesApi.createExpense,
		onMutate: async (newExpense) => {
			await queryClient.cancelQueries({
				queryKey: queryKeys.expenses.root,
			});

			const previousLists =
				queryClient.getQueriesData<ExpensesListPayload>({
					queryKey: queryKeys.expenses.root,
				});

			previousLists.forEach(([key, payload]) => {
				if (!payload) {
					return;
				}

				const optimisticExpense: ExpenseItem = {
					_id: `optimistic-${Date.now()}`,
					title: newExpense.title,
					amount: newExpense.amount,
					currency: newExpense.currency,
					dateTime: newExpense.dateTime,
					categoryId: newExpense.categoryId,
					images: newExpense.images,
					location: newExpense.location,
					notes: newExpense.notes,
					paymentMethod: newExpense.paymentMethod,
					tags: newExpense.tags,
				};

				queryClient.setQueryData<ExpensesListPayload>(key, {
					...payload,
					items: [optimisticExpense, ...payload.items],
					total: payload.total + 1,
				});
			});

			return { previousLists };
		},
		onError: (_error, _variables, context) => {
			context?.previousLists?.forEach(([key, payload]) => {
				queryClient.setQueryData(key, payload);
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.expenses.root,
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.dashboard,
			});
		},
	});

	const createCategory = useMutation({
		mutationFn: expensesApi.createCategory,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.categories,
			});
		},
	});

	const deleteCategory = useMutation({
		mutationFn: expensesApi.deleteCategory,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.categories,
			});
		},
	});

	const updateExpense = useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: Partial<ExpenseItem>;
		}) => expensesApi.updateExpense(id, payload),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.expenses.root,
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.expenses.detail(variables.id),
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.dashboard,
			});
		},
	});

	const deleteExpense = useMutation({
		mutationFn: expensesApi.deleteExpense,
		onMutate: async (id) => {
			await queryClient.cancelQueries({
				queryKey: queryKeys.expenses.root,
			});
			const previousLists =
				queryClient.getQueriesData<ExpensesListPayload>({
					queryKey: queryKeys.expenses.root,
				});

			previousLists.forEach(([key, payload]) => {
				if (!payload) {
					return;
				}

				queryClient.setQueryData<ExpensesListPayload>(key, {
					...payload,
					items: payload.items.filter((item) => item._id !== id),
					total: Math.max(0, payload.total - 1),
				});
			});

			return { previousLists };
		},
		onError: (_error, _variables, context) => {
			context?.previousLists?.forEach(([key, payload]) => {
				queryClient.setQueryData(key, payload);
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.expenses.root,
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.dashboard,
			});
		},
	});

	return {
		createExpense,
		updateExpense,
		deleteExpense,
		createCategory,
		deleteCategory,
	};
}
