"use client";

import { useEffect, useState } from "react";

import { bucketsApi } from "@/lib/api/buckets";
import { expensesApi } from "@/lib/api/expenses";
import type { BucketMemberWithName, BucketSummary } from "@/types/bucket.types";
import { scopedCategoryRequest } from "@/lib/filters";
import type { CategoryItem } from "@/types/expense.types";
import type { BucketPreset } from "@/types/search.types";
import type { FilterOwner } from "./owner-filter-section";

export function selectedBuckets(
  buckets: BucketSummary[],
  preset: BucketPreset | undefined,
  bucketIds: string[] | undefined,
): BucketSummary[] {
  // ponytail: keep preset compat for legacy callers; new nested list uses ids-only
  if (preset === "PERSONAL") return buckets.filter((b) => b.isPersonal);
  if (preset === "MULTIPLE") {
    if (!bucketIds || bucketIds.length === 0) return buckets;
    return buckets.filter((b) => bucketIds.includes(b._id));
  }
  if (preset === "ALL") return buckets;
  // ids-only (preset undefined): empty = all
  if (!bucketIds || bucketIds.length === 0) return buckets;
  return buckets.filter((b) => bucketIds.includes(b._id));
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
  categoriesByBucket: Record<string, CategoryItem[]>;
} {
  const [data, setData] = useState<{
    key: string | null;
    categories: CategoryItem[];
    categoriesByBucket: Record<string, CategoryItem[]>;
    owners: FilterOwner[];
  }>({ key: null, categories: [], categoriesByBucket: {}, owners: [] });

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
        const byBucket: Record<string, CategoryItem[]> = {};
        ids.forEach((id, idx) => {
          byBucket[id] = dedupeById(categoryLists[idx] ?? []);
        });
        setData({
          key: scopedIds,
          categories: dedupeById(categoryLists.flat()),
          categoriesByBucket: byBucket,
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
        if (!cancelled)
          setData({ key: scopedIds, categories: [], categoriesByBucket: {}, owners: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, scopedIds, data.key]);

  return {
    categories: data.categories,
    categoriesByBucket: data.categoriesByBucket,
    owners: data.owners,
    isLoading: enabled && data.key !== scopedIds,
  };
}

export function useAllBucketCategories(
  enabled: boolean,
  buckets: BucketSummary[],
): {
  categoriesByBucket: Record<string, CategoryItem[]>;
  isLoading: boolean;
} {
  const [data, setData] = useState<{
    key: string | null;
    byBucket: Record<string, CategoryItem[]>;
  }>({ key: null, byBucket: {} });

  const allIds = buckets
    .map((b) => b._id)
    .sort()
    .join(",");

  useEffect(() => {
    if (!enabled || data.key === allIds) return;
    const ids = allIds ? allIds.split(",") : [];
    let cancelled = false;
    if (ids.length === 0) {
      // empty buckets — no fetch needed, but defer setData to avoid cascading render lint
      queueMicrotask(() => {
        if (!cancelled) setData({ key: allIds, byBucket: {} });
      });
      return () => {
        cancelled = true;
      };
    }
    Promise.all(
      ids.map((id) =>
        expensesApi
          .searchCategories(scopedCategoryRequest(id))
          .then((r) => r.items)
          .catch((): CategoryItem[] => []),
      ),
    )
      .then((lists) => {
        if (cancelled) return;
        const byBucket: Record<string, CategoryItem[]> = {};
        ids.forEach((id, idx) => {
          byBucket[id] = dedupeById(lists[idx] ?? []);
        });
        setData({ key: allIds, byBucket });
      })
      .catch(() => {
        if (!cancelled) setData({ key: allIds, byBucket: {} });
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, allIds, data.key]);

  return {
    categoriesByBucket: data.byBucket,
    isLoading: enabled && data.key !== allIds,
  };
}
