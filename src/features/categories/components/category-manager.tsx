"use client";

import { useState, useEffect } from "react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterBar, useScopedOptions } from "@/components/filters";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchCategoriesWithStats } from "@/store/slices/categorySlice";
import { CategoryCard } from "@/features/categories/components/category-card";
import { AddCategoryDialog } from "@/features/categories/components/add-category-dialog";
import { formatCurrency } from "@/lib/format";
import { categoryCriteria } from "@/lib/filters";
import { sortForVariant } from "@/components/filters/variants";
import { StatCard } from "@/components/stat-card";

export function CategoryManager() {
  const dispatch = useAppDispatch();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filterState = useAppSelector((s) => s.filters.categories);
  const filterCriteria = filterState.filterCriteria;
  const sortCriteria = filterState.sortCriteria;

  const [loadedFor, setLoadedFor] = useState(filterCriteria);
  if (loadedFor !== filterCriteria) {
    setLoadedFor(filterCriteria);
  }

  const buckets = useAppSelector((s) => s.buckets.allBuckets);
  const currency = useAppSelector((s) => s.ui.currency);
  const categoriesWithStats = useAppSelector((s) => s.categories.itemsWithStats);

  const { owners } = useScopedOptions(
    true,
    buckets,
    filterCriteria.bucketPreset,
    filterCriteria.bucketIds,
  );

  useEffect(() => {
    dispatch(
      fetchCategoriesWithStats({
        filterCriteria: categoryCriteria(filterCriteria, "categories"),
        sortCriteria: sortForVariant("categories", sortCriteria),
      }),
    );
  }, [dispatch, filterCriteria, sortCriteria]);

  const summaryCells: Array<[string, string]> = [
    ["Total", formatCurrency(categoriesWithStats?.stats?.total ?? 0, currency)],
    ["Avg", formatCurrency(categoriesWithStats?.stats?.avg ?? 0, currency)],
    ["Min", formatCurrency(categoriesWithStats?.stats?.min ?? 0, currency)],
    ["Max", formatCurrency(categoriesWithStats?.stats?.max ?? 0, currency)],
    ["Categories", String(categoriesWithStats?.stats?.count ?? 0)],
    ["Expenses", String(categoriesWithStats?.stats?.expenseCount ?? 0)],
  ];

  return (
    <div className="flex gap-2 flex-col">
      <FilterBar variant="categories" buckets={buckets} categories={[]} owners={owners} />
      <div className="flex flex-wrap gap-2">
        {!categoriesWithStats
          ? Array.from({ length: summaryCells.length }).map((_, i) => (
              <Card key={i} className="min-w-[100px] flex-1">
                <Skeleton className="h-3 w-15 mb-2"></Skeleton>
                <Skeleton className="h-4 w-20"></Skeleton>
              </Card>
            ))
          : summaryCells.map(([label, value]) => (
              <StatCard key={label} title={label} value={value} />
            ))}
      </div>

      <div className="grid grid-cols-1 gap-2">
        {categoriesWithStats?.items?.map((category) => {
          return (
            <div key={category._id}>
              <CategoryCard category={category} />
            </div>
          );
        })}
        {categoriesWithStats?.items?.length === 0 && (
          <p className="col-span-full text-center text-sm text-[var(--color-muted)] py-8">
            No categories found
          </p>
        )}
      </div>

      <AddCategoryDialog open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
