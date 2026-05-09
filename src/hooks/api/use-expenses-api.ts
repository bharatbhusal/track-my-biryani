'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { expensesApi } from '@/lib/api/expenses';
import { queryKeys } from '@/lib/api/query-keys';

export function useCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: expensesApi.listCategories,
  });
}

export function useExpensesQuery(page = 1, limit = 20) {
  return useQuery({
    queryKey: queryKeys.expenses.list(page, limit),
    queryFn: () => expensesApi.listExpenses(page, limit),
    select: (payload) => payload.items,
  });
}

export function useExpenseMutations() {
  const queryClient = useQueryClient();

  const createExpense = useMutation({
    mutationFn: expensesApi.createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.root });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });

  const createCategory = useMutation({
    mutationFn: expensesApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: expensesApi.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });

  return { createExpense, createCategory, deleteCategory };
}
