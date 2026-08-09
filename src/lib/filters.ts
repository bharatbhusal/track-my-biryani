import type { BucketSummary } from "@/types/bucket.types";
import type {
	CategorySearchRequest,
	ExpenseSearchRequest,
	FilterDatePreset,
} from "@/types/search.types";

// ponytail: the stats/chart/distribution endpoints still demand a concrete
// from/to pair, so ANY_TIME (and a half-open custom range) widen to epoch..now.
export function filterBounds(
	bounds: { from?: string; to?: string } | null,
): { from: string; to: string } {
	return {
		from: bounds?.from ?? new Date(0).toISOString(),
		to: bounds?.to ?? new Date().toISOString(),
	};
}

export function chartGranularity(preset: FilterDatePreset): string {
	if (preset === "TODAY" || preset === "YESTERDAY") return "day";
	if (
		preset === "THIS_YEAR" ||
		preset === "LAST_YEAR" ||
		preset === "ANY_TIME"
	)
		return "year";
	return "month";
}

export function personalBucketId(
	buckets: BucketSummary[],
): string {
	return (
		buckets.find((b) => b.isPersonal)?._id ??
		buckets[0]?._id ??
		""
	);
}

export function scopedCategoryRequest(
	bucketId: string,
): CategorySearchRequest {
	return {
		filterCriteria: {
			bucketPreset: "MULTIPLE",
			bucketIds: [bucketId],
			ownerPreset: "ALL",
			ownerIds: [],
			datePreset: "ANY_TIME",
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
			datePreset: from || to ? "CUSTOM" : "ANY_TIME",
			customFrom: from,
			customTo: to,
		},
		sortCriteria: { field: "paidAt", direction: "DESC" },
		pagination: { page, pageSize },
	};
}
