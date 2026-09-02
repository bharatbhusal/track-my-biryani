export type BucketPreset = "PERSONAL" | "ALL" | "MULTIPLE";
export type OwnerPreset = "ME" | "ALL" | "MULTIPLE";
export type CategoryPreset = "ALL" | "MULTIPLE";
export type SortDirection = "ASC" | "DESC";

export type FilterDatePreset =
  | "TODAY"
  | "YESTERDAY"
  | "THIS_WEEK"
  | "LAST_WEEK"
  | "THIS_MONTH"
  | "LAST_MONTH"
  | "LAST_6_MONTHS"
  | "THIS_YEAR"
  | "LAST_YEAR"
  | "CUSTOM";

export interface PaginationCriteria {
  page: number;
  pageSize: number;
}

export interface SortCriteria {
  field: string;
  direction: SortDirection;
}

export interface ExpenseFilterCriteria {
  bucketPreset: BucketPreset;
  bucketIds: string[];
  categoryPreset: CategoryPreset;
  categoryIds: string[];
  ownerPreset: OwnerPreset;
  ownerIds: string[];
  datePreset: FilterDatePreset;
  customFrom?: string;
  customTo?: string;
  hasNotes?: boolean;
  hasLocation?: boolean;
  q?: string;
}

export interface CategoryFilterCriteria {
  bucketPreset: BucketPreset;
  bucketIds: string[];
  ownerPreset: OwnerPreset;
  ownerIds: string[];
  datePreset?: FilterDatePreset;
  customFrom?: string;
  customTo?: string;
  q?: string;
}

export interface AuditFilterCriteria {
  bucketPreset: BucketPreset;
  bucketIds: string[];
  ownerPreset: OwnerPreset;
  ownerIds: string[];
  datePreset: FilterDatePreset;
  customFrom?: string;
  customTo?: string;
}

export interface BucketFilterCriteria {
  datePreset: FilterDatePreset;
  customFrom?: string;
  customTo?: string;
  ownerPreset?: OwnerPreset;
  ownerIds?: string[];
}

export type SearchRequest<TFilter> = {
  filterCriteria: TFilter;
  sortCriteria: SortCriteria;
  pagination: PaginationCriteria;
};

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

export type ExpenseSearchRequest = SearchRequest<ExpenseFilterCriteria>;
export type CategorySearchRequest = SearchRequest<CategoryFilterCriteria>;
export type BucketSearchRequest = SearchRequest<BucketFilterCriteria>;
export type AuditSearchRequest = SearchRequest<AuditFilterCriteria>;

export type DistributionDimension = "category" | "owner" | "bucket";

export type DistributionRequest = {
  dimension: DistributionDimension;
  filterCriteria: ExpenseFilterCriteria;
};
