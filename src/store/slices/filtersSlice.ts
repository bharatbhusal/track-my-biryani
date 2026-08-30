import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  AuditFilterCriteria,
  BucketFilterCriteria,
  BucketPreset,
  CategoryFilterCriteria,
  CategoryPreset,
  ExpenseFilterCriteria,
  FilterDatePreset,
  OwnerPreset,
  PaginationCriteria,
  SortCriteria,
  SortDirection,
} from "@/types/search.types";

export type FilterVariant =
  "expenses" | "expense" | "categories" | "category" | "buckets" | "bucket" | "logs";

type VariantCriteriaMap = {
  expenses: ExpenseFilterCriteria;
  expense: ExpenseFilterCriteria;
  categories: CategoryFilterCriteria;
  category: ExpenseFilterCriteria;
  buckets: BucketFilterCriteria;
  bucket: ExpenseFilterCriteria;
  logs: AuditFilterCriteria;
};

type VariantState<V extends FilterVariant> = {
  filterCriteria: VariantCriteriaMap[V];
  sortCriteria: SortCriteria;
  pagination: PaginationCriteria;
};

export type FiltersByVariant = {
  [V in FilterVariant]: VariantState<V>;
};

const defaultExpenseCriteria: ExpenseFilterCriteria = {
  bucketPreset: "ALL",
  bucketIds: [],
  categoryPreset: "ALL",
  categoryIds: [],
  ownerPreset: "ALL",
  ownerIds: [],
  datePreset: "THIS_MONTH",
};

const defaultCategoryCriteria: CategoryFilterCriteria = {
  bucketPreset: "ALL",
  bucketIds: [],
  ownerPreset: "ALL",
  ownerIds: [],
  datePreset: "THIS_MONTH",
};

const defaultBucketCriteria: BucketFilterCriteria = {
  datePreset: "THIS_MONTH",
};

const defaultAuditCriteria: AuditFilterCriteria = {
  bucketPreset: "ALL",
  bucketIds: [],
  ownerPreset: "ALL",
  ownerIds: [],
  datePreset: "THIS_MONTH",
};

const defaultPagination: PaginationCriteria = { page: 1, pageSize: 20 };

function paginationFor(_variant: FilterVariant): PaginationCriteria {
  return { ...defaultPagination };
}

function sortFor(variant: FilterVariant): SortCriteria {
  switch (variant) {
    case "expenses":
    case "expense":
    case "category":
    case "bucket":
      return { field: "paidAt", direction: "DESC" };
    case "categories":
      return { field: "amount", direction: "DESC" };
    case "buckets":
      return { field: "totalAmount", direction: "DESC" };
    case "logs":
      return { field: "timestamp", direction: "DESC" };
    default:
      return { field: "paidAt", direction: "DESC" };
  }
}

export const initialFiltersState: FiltersByVariant = {
  expenses: {
    filterCriteria: { ...defaultExpenseCriteria },
    sortCriteria: sortFor("expenses"),
    pagination: paginationFor("expenses"),
  },
  expense: {
    filterCriteria: { ...defaultExpenseCriteria },
    sortCriteria: sortFor("expense"),
    pagination: paginationFor("expense"),
  },
  categories: {
    filterCriteria: { ...defaultCategoryCriteria },
    sortCriteria: sortFor("categories"),
    pagination: paginationFor("categories"),
  },
  category: {
    filterCriteria: { ...defaultExpenseCriteria },
    sortCriteria: sortFor("category"),
    pagination: paginationFor("category"),
  },
  buckets: {
    filterCriteria: { ...defaultBucketCriteria },
    sortCriteria: sortFor("buckets"),
    pagination: paginationFor("buckets"),
  },
  bucket: {
    filterCriteria: { ...defaultExpenseCriteria },
    sortCriteria: sortFor("bucket"),
    pagination: paginationFor("bucket"),
  },
  logs: {
    filterCriteria: { ...defaultAuditCriteria },
    sortCriteria: sortFor("logs"),
    pagination: paginationFor("logs"),
  },
};

// ponytail: per-variant isolated state — each FilterVariant owns its criteria/sort/pagination
const filtersSlice = createSlice({
  name: "filters",
  initialState: initialFiltersState as FiltersByVariant,
  reducers: {
    setBucketFilter(
      state,
      action: PayloadAction<{
        variant: FilterVariant;
        preset: BucketPreset;
        ids: string[];
      }>,
    ) {
      const v = action.payload.variant;
      const s: any = (state as any)[v];
      if (!s || (s.filterCriteria.bucketPreset === undefined && v === "buckets")) return;
      s.filterCriteria.bucketPreset = action.payload.preset;
      s.filterCriteria.bucketIds = action.payload.ids;
      s.pagination.page = 1;
    },
    setCategoryFilter(
      state,
      action: PayloadAction<{
        variant: FilterVariant;
        preset: CategoryPreset;
        ids: string[];
      }>,
    ) {
      const v = action.payload.variant;
      const s: any = (state as any)[v];
      if (!s || s.filterCriteria.categoryPreset === undefined) return;
      s.filterCriteria.categoryPreset = action.payload.preset;
      s.filterCriteria.categoryIds = action.payload.ids;
      s.pagination.page = 1;
    },
    setOwnerFilter(
      state,
      action: PayloadAction<{
        variant: FilterVariant;
        preset: OwnerPreset;
        ids: string[];
      }>,
    ) {
      const v = action.payload.variant;
      const s: any = (state as any)[v];
      if (!s) return;
      s.filterCriteria.ownerPreset = action.payload.preset;
      s.filterCriteria.ownerIds = action.payload.ids;
      s.pagination.page = 1;
    },
    setDateFilter(
      state,
      action: PayloadAction<{
        variant: FilterVariant;
        preset: FilterDatePreset;
        customFrom?: string;
        customTo?: string;
      }>,
    ) {
      const v = action.payload.variant;
      const s: any = (state as any)[v];
      if (!s) return;
      s.filterCriteria.datePreset = action.payload.preset;
      s.filterCriteria.customFrom = action.payload.customFrom;
      s.filterCriteria.customTo = action.payload.customTo;
      s.pagination.page = 1;
    },
    setSort(
      state,
      action: PayloadAction<{
        variant: FilterVariant;
        field: string;
        direction: SortDirection;
      }>,
    ) {
      const v = action.payload.variant;
      const s: any = (state as any)[v];
      if (!s) return;
      s.sortCriteria = { field: action.payload.field, direction: action.payload.direction };
      s.pagination.page = 1;
    },
    setPage(state, action: PayloadAction<{ variant: FilterVariant; page: number }>) {
      const v = action.payload.variant;
      const s: any = (state as any)[v];
      if (!s) return;
      s.pagination.page = action.payload.page;
    },
    setHasNotes(
      state,
      action: PayloadAction<{ variant: FilterVariant; value: boolean | undefined }>,
    ) {
      const v = action.payload.variant;
      const s: any = (state as any)[v];
      if (!s || (s.filterCriteria.hasNotes === undefined && action.payload.value === undefined)) {
        // allow even if not present
      }
      if (s.filterCriteria.hasNotes !== undefined || action.payload.value !== undefined) {
        // only expense-like variants have hasNotes
        if ("hasNotes" in s.filterCriteria || action.payload.value !== undefined) {
          s.filterCriteria.hasNotes = action.payload.value;
          s.pagination.page = 1;
        }
      } else if (v === "expenses" || v === "expense" || v === "category" || v === "bucket") {
        (s.filterCriteria as any).hasNotes = action.payload.value;
        s.pagination.page = 1;
      }
    },
    setHasLocation(
      state,
      action: PayloadAction<{ variant: FilterVariant; value: boolean | undefined }>,
    ) {
      const v = action.payload.variant;
      const s: any = (state as any)[v];
      if (!s) return;
      if (v === "expenses" || v === "expense" || v === "category" || v === "bucket") {
        (s.filterCriteria as any).hasLocation = action.payload.value;
        s.pagination.page = 1;
      }
    },
    setSearch(state, action: PayloadAction<{ variant: FilterVariant; q: string | undefined }>) {
      const v = action.payload.variant;
      const s: any = (state as any)[v];
      if (!s) return;
      s.filterCriteria.q = action.payload.q;
      s.pagination.page = 1;
    },
    clearBucketFilter(state, action: PayloadAction<{ variant: FilterVariant }>) {
      const v = action.payload.variant;
      const s: any = (state as any)[v];
      if (!s || (s.filterCriteria.bucketPreset === undefined && v === "buckets")) return;
      s.filterCriteria.bucketPreset = "ALL";
      // personal default was previous clear -> now ALL for generic
      if (v === "expenses" || v === "expense" || v === "category" || v === "bucket") {
        s.filterCriteria.bucketPreset = "PERSONAL";
      }
      s.filterCriteria.bucketIds = [];
      s.pagination.page = 1;
    },
    clearCategoryFilter(state, action: PayloadAction<{ variant: FilterVariant }>) {
      const v = action.payload.variant;
      const s: any = (state as any)[v];
      if (!s || s.filterCriteria.categoryPreset === undefined) return;
      s.filterCriteria.categoryPreset = "ALL";
      s.filterCriteria.categoryIds = [];
      s.pagination.page = 1;
    },
    clearOwnerFilter(state, action: PayloadAction<{ variant: FilterVariant }>) {
      const v = action.payload.variant;
      const s: any = (state as any)[v];
      if (!s || s.filterCriteria.ownerPreset === undefined) return;
      if (v === "buckets") {
        s.filterCriteria.ownerPreset = undefined;
        s.filterCriteria.ownerIds = undefined;
      } else {
        s.filterCriteria.ownerPreset = "ALL";
        // per-variant: keep ME for some? use ALL generic
        if (v === "expenses" || v === "expense" || v === "category" || v === "bucket") {
          // keep previous semantics: logs/categories had ME vs ALL differences but now uniform
        }
        s.filterCriteria.ownerIds = [];
      }
      s.pagination.page = 1;
    },
    clearDateFilter(state, action: PayloadAction<{ variant: FilterVariant }>) {
      const v = action.payload.variant;
      const s: any = (state as any)[v];
      if (!s) return;
      s.filterCriteria.datePreset = "THIS_MONTH";
      s.filterCriteria.customFrom = undefined;
      s.filterCriteria.customTo = undefined;
      s.pagination.page = 1;
    },
    clearSort(state, action: PayloadAction<{ variant: FilterVariant }>) {
      const v = action.payload.variant;
      const s: any = (state as any)[v];
      if (!s) return;
      s.sortCriteria = sortFor(v);
      s.pagination.page = 1;
    },
    clearAdditionalFilters(state, action: PayloadAction<{ variant: FilterVariant }>) {
      const v = action.payload.variant;
      const s: any = (state as any)[v];
      if (!s) return;
      if ("hasNotes" in s.filterCriteria) s.filterCriteria.hasNotes = undefined;
      if ("hasLocation" in s.filterCriteria) s.filterCriteria.hasLocation = undefined;
      s.pagination.page = 1;
    },
    clearAllFilters(state, action: PayloadAction<{ variant: FilterVariant }>) {
      const v = action.payload.variant;
      if ((initialFiltersState as any)[v]) {
        (state as any)[v] = {
          filterCriteria: { ...(initialFiltersState as any)[v].filterCriteria },
          sortCriteria: { ...(initialFiltersState as any)[v].sortCriteria },
          pagination: { ...(initialFiltersState as any)[v].pagination },
        };
      }
    },
    clearAllVariants() {
      return { ...initialFiltersState } as FiltersByVariant;
    },
  },
});

export const {
  setBucketFilter,
  setCategoryFilter,
  setOwnerFilter,
  setDateFilter,
  setSort,
  setPage,
  setHasNotes,
  setHasLocation,
  setSearch,
  clearBucketFilter,
  clearCategoryFilter,
  clearOwnerFilter,
  clearDateFilter,
  clearSort,
  clearAdditionalFilters,
  clearAllFilters,
  clearAllVariants,
} = filtersSlice.actions;
export default filtersSlice.reducer;
