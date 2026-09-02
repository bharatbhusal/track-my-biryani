import type { BucketSummary } from "@/constants/types/bucket.types";
import type {
  AuditFilterCriteria,
  BucketFilterCriteria,
  CategoryFilterCriteria,
  CategorySearchRequest,
  ExpenseFilterCriteria,
  ExpenseSearchRequest,
  FilterDatePreset,
} from "@/constants/types/search.types";
import { SECTIONS, type FilterVariant } from "@/components/filters/variants";

// per-variant omit disabled sections before API — disabled bucket/category/owner/search/additional fields are not sent
export function stripCriteriaForVariant(
  variant: FilterVariant,
  criteria: Record<string, unknown>,
): Record<string, unknown> {
  const flags = SECTIONS[variant];
  const out: Record<string, unknown> = { ...criteria };
  if (!flags.buckets) {
    delete out.bucketPreset;
    delete out.bucketIds;
  }
  if (!flags.categories) {
    delete out.categoryPreset;
    delete out.categoryIds;
  }
  if (!flags.owners) {
    delete out.ownerPreset;
    delete out.ownerIds;
  }
  if (!flags.search) delete out.q;
  if (!flags.additional) {
    delete out.hasNotes;
    delete out.hasLocation;
  }
  if (!flags.date) {
    delete out.datePreset;
    delete out.customFrom;
    delete out.customTo;
  }
  return out;
}

export function expenseCriteriaForVariant(
  variant: FilterVariant,
  c: ExpenseFilterCriteria,
): ExpenseFilterCriteria {
  const stripped = stripCriteriaForVariant(variant, c as unknown as Record<string, unknown>);
  return stripped as unknown as ExpenseFilterCriteria;
}

export function categoryCriteria(
  c: ExpenseFilterCriteria | CategoryFilterCriteria,
  variant: FilterVariant = "categories",
): CategoryFilterCriteria {
  const base: CategoryFilterCriteria = {
    bucketPreset: (c as any).bucketPreset ?? "ALL",
    bucketIds: (c as any).bucketIds ?? [],
    ownerPreset: (c as any).ownerPreset ?? "ALL",
    ownerIds: (c as any).ownerIds ?? [],
    datePreset: c.datePreset,
    customFrom: c.customFrom,
    customTo: c.customTo,
    q: (c as any).q,
  };
  const stripped = stripCriteriaForVariant(variant, base as unknown as Record<string, unknown>);
  return stripped as unknown as CategoryFilterCriteria;
}

export function auditCriteria(
  c: ExpenseFilterCriteria | AuditFilterCriteria,
  variant: FilterVariant = "logs",
): AuditFilterCriteria {
  const base: AuditFilterCriteria = {
    bucketPreset: (c as any).bucketPreset ?? "ALL",
    bucketIds: (c as any).bucketIds ?? [],
    ownerPreset: (c as any).ownerPreset ?? "ALL",
    ownerIds: (c as any).ownerIds ?? [],
    datePreset: c.datePreset,
    customFrom: c.customFrom,
    customTo: c.customTo,
  };
  const stripped = stripCriteriaForVariant(variant, base as unknown as Record<string, unknown>);
  return stripped as unknown as AuditFilterCriteria;
}

export function bucketCriteria(
  c: ExpenseFilterCriteria | BucketFilterCriteria,
  variant: FilterVariant = "buckets",
): BucketFilterCriteria {
  const base: BucketFilterCriteria = {
    datePreset: c.datePreset,
    customFrom: c.customFrom,
    customTo: c.customTo,
    ownerPreset: (c as any).ownerPreset,
    ownerIds: (c as any).ownerIds,
  };
  const stripped = stripCriteriaForVariant(variant, base as unknown as Record<string, unknown>);
  delete (stripped as any).bucketPreset;
  delete (stripped as any).bucketIds;
  delete (stripped as any).categoryPreset;
  delete (stripped as any).categoryIds;
  delete (stripped as any).hasNotes;
  delete (stripped as any).hasLocation;
  delete (stripped as any).q;
  return stripped as unknown as BucketFilterCriteria;
}

// ponytail: the stats/chart/distribution endpoints still demand a concrete
export function filterBounds(bounds: { from?: string; to?: string } | null): {
  from: string;
  to: string;
} {
  return {
    from: bounds?.from ?? new Date(0).toISOString(),
    to: bounds?.to ?? new Date().toISOString(),
  };
}

export function chartGranularity(preset: FilterDatePreset): string {
  if (preset === "TODAY" || preset === "YESTERDAY") return "day";
  if (preset === "THIS_YEAR" || preset === "LAST_YEAR") return "year";
  return "month";
}

export function personalBucketId(buckets: BucketSummary[]): string {
  return buckets.find((b) => b.isPersonal)?._id ?? buckets[0]?._id ?? "";
}

export function scopedCategoryRequest(bucketId: string): CategorySearchRequest {
  return {
    filterCriteria: {
      bucketPreset: "MULTIPLE",
      bucketIds: [bucketId],
      ownerPreset: "ALL",
      ownerIds: [],
    },
    sortCriteria: { field: "createdAt", direction: "DESC" },
    pagination: { page: 1, pageSize: 100 },
  };
}

// ponytail: detail views need "other expenses in this category", which is not
// what the page-wide filter state describes — so they build their own request.
export function scopedExpenseRequest({
  bucketId,
  categoryId,
  page,
  pageSize = 20,
  from,
  to,
}: {
  bucketId?: string;
  categoryId: string;
  page: number;
  pageSize?: number;
  from?: string;
  to?: string;
}): ExpenseSearchRequest {
  return {
    filterCriteria: {
      bucketPreset: bucketId ? "MULTIPLE" : "ALL",
      bucketIds: bucketId ? [bucketId] : [],
      categoryPreset: "MULTIPLE",
      categoryIds: [categoryId],
      ownerPreset: "ALL",
      ownerIds: [],
      datePreset: from || to ? "CUSTOM" : "THIS_MONTH",
      customFrom: from,
      customTo: to,
    },
    sortCriteria: { field: "paidAt", direction: "DESC" },
    pagination: { page, pageSize },
  };
}
