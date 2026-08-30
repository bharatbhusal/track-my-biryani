import { apiRequest } from "@/lib/api/client";
import type {
  BudgetGroup,
  BudgetItem,
  CreateBudgetPayload,
  UpdateBudgetPayload,
} from "@/types/budget.types";
import type { CategoryItem } from "@/types/expense.types";
import type { SearchResult } from "@/types/search.types";

export const budgetsApi = {
  list: () => apiRequest<BudgetGroup[]>("/budgets", { method: "GET" }),
  create: (payload: CreateBudgetPayload) =>
    apiRequest<BudgetItem>("/budgets", { method: "POST", body: payload }),
  update: (id: string, payload: UpdateBudgetPayload) =>
    apiRequest<BudgetItem>(`/budgets/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: payload,
    }),
  remove: (id: string) =>
    apiRequest<{ message: string }>(`/budgets/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  // used by budget-form to load categories for selected bucket without inlining apiRequest
  searchCategories: (bucketId: string) =>
    apiRequest<SearchResult<CategoryItem>>("/categories/search", {
      method: "POST",
      body: {
        filterCriteria: {
          bucketPreset: "MULTIPLE",
          bucketIds: [bucketId],
          ownerPreset: "ALL",
          ownerIds: [],
          datePreset: "THIS_MONTH",
        },
        sortCriteria: { field: "name", direction: "ASC" },
        pagination: { page: 1, pageSize: 100 },
      },
    }),
};

// ponytail: alias expected by callers that import `searchBuckets` from this module
export const searchBuckets = budgetsApi.searchCategories;
