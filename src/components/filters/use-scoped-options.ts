"use client";

import { useEffect, useState } from "react";

import { bucketsApi } from "@/lib/api/buckets";
import { expensesApi } from "@/lib/api/expenses";
import type {
	BucketMemberWithName,
	BucketSummary,
} from "@/types/bucket.types";
import { scopedCategoryRequest } from "@/lib/filters";
import type { CategoryItem } from "@/types/expense.types";
import type { BucketPreset } from "@/types/search.types";
import type { FilterOwner } from "./owner-filter-section";

export function selectedBuckets(
	buckets: BucketSummary[],
	preset: BucketPreset | undefined,
	bucketIds: string[] | undefined,
): BucketSummary[] {
	if (preset === "PERSONAL")
		return buckets.filter((b) => b.isPersonal);
	if (preset === "MULTIPLE")
		return buckets.filter((b) =>
			(bucketIds ?? []).includes(b._id),
		);
	return buckets;
}

function dedupeById<T extends { _id: string }>(items: T[]): T[] {
	return [...new Map(items.map((i) => [i._id, i])).values()];
}

// ponytail: owners come from the members already stored on each bucket — no new
// endpoint (mission rung 2). Categories are fetched per selected bucket and
// merged locally instead of dispatching fetchCategories, which would clobber
// the shared category slice the pages render from.
export function useScopedOptions(
	enabled: boolean,
	buckets: BucketSummary[],
	preset: BucketPreset | undefined,
	bucketIds: string[] | undefined,
): {
	categories: CategoryItem[];
	owners: FilterOwner[];
	isLoading: boolean;
} {
	const [data, setData] = useState<{
		key: string | null;
		categories: CategoryItem[];
		owners: FilterOwner[];
	}>({ key: null, categories: [], owners: [] });

	const scopedIds = selectedBuckets(buckets, preset, bucketIds)
		.map((b) => b._id)
		.sort()
		.join(",");

	useEffect(() => {
		if (!enabled || data.key === scopedIds) return;
		const ids = scopedIds ? scopedIds.split(",") : [];
		let cancelled = false;

		Promise.all([
			Promise.all(
				ids.map((id) =>
					expensesApi
						.searchCategories(scopedCategoryRequest(id))
						.then((r) => r.items)
						.catch((): CategoryItem[] => []),
				),
			),
			Promise.all(
				ids.map((id) =>
					bucketsApi
						.getBucketStats(id)
						.then((d) => d.members)
						.catch((): BucketMemberWithName[] => []),
				),
			),
		])
			.then(([categoryLists, memberLists]) => {
				if (cancelled) return;
				setData({
					key: scopedIds,
					categories: dedupeById(categoryLists.flat()),
					owners: [
						...new Map(
							memberLists.flat().map((m) => [
								m.userId,
								{
									id: m.userId,
									name: m.name,
									username: m.username ?? "",
								},
							]),
						).values(),
					].sort((a, b) => a.name.localeCompare(b.name)),
				});
			})
			.catch(() => {
				if (!cancelled) setData({ key: scopedIds, categories: [], owners: [] });
			});

		return () => {
			cancelled = true;
		};
	}, [enabled, scopedIds, data.key]);

	return {
		categories: data.categories,
		owners: data.owners,
		isLoading: enabled && data.key !== scopedIds,
	};
}
