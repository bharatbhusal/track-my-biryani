"use client";

import { useMemo, useState, useEffect } from "react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	FilterBar,
	useScopedOptions,
	sortForVariant,
} from "@/components/filters";
import {
	useAppSelector,
	useAppDispatch,
} from "@/store/hooks";
import { fetchCategoriesWithStats } from "@/store/slices/categorySlice";
import { fetchAllBuckets } from "@/store/slices/bucketSlice";
import { CategoryCard } from "@/features/categories/components/category-card";
import { AddCategoryDialog } from "@/features/categories/components/add-category-dialog";
import { formatCurrency } from "@/lib/format";

export function CategoryManager() {
	const dispatch = useAppDispatch();
	const [drawerOpen, setDrawerOpen] = useState(false);

	const filterCriteria = useAppSelector(
		(s) => s.filters.filterCriteria,
	);

	// ponytail: refetching for new criteria shows the skeleton again — the
	// render-time comparison keeps the loading flip out of an effect.
	const [loadedFor, setLoadedFor] = useState(filterCriteria);
	if (loadedFor !== filterCriteria) {
		setLoadedFor(filterCriteria);
	}

	const sortCriteria = useAppSelector(
		(s) => s.filters.sortCriteria,
	);
	const buckets = useAppSelector(
		(s) => s.buckets.allBuckets,
	);
	const currency = useAppSelector((s) => s.ui.currency);
	const categoriesWithStats = useAppSelector(
		(s) => s.categories.itemsWithStats,
	);

	// ponytail: owners come from bucket members through the shared hook, so the
	// user filter can list everyone in the selected buckets.
	const { owners } = useScopedOptions(
		true,
		buckets,
		filterCriteria.bucketPreset,
		filterCriteria.bucketIds,
	);

	useEffect(() => {
		dispatch(fetchAllBuckets());
	}, [dispatch]);

	useEffect(() => {
		dispatch(fetchCategoriesWithStats(filterCriteria));
	}, [dispatch, filterCriteria]);

	// ponytail: /categories/stats returns without an order, so amount sorting
	// is applied here against the fetched page, normalized to this page's own
	// field set like every other consumer.
	const effectiveSort = sortForVariant(
		"categories",
		sortCriteria,
	);
	const items = useMemo(() => {
		const dir = effectiveSort.direction === "ASC" ? 1 : -1;

		return categoriesWithStats?.items
			.slice()
			.sort((a, b) =>
				effectiveSort.field === "amount"
					? ((a.stats?.total ?? 0) - (b.stats?.total ?? 0)) * dir
					: a._id.localeCompare(b._id) * dir,
			);
	}, [
		categoriesWithStats,
		effectiveSort.field,
		effectiveSort.direction,
	]);

	const summaryCells: Array<[string, string]> = [
		[
			"Total",
			formatCurrency(
				categoriesWithStats?.stats.total ?? 0,
				currency,
			),
		],
		[
			"Avg",
			formatCurrency(
				categoriesWithStats?.stats.avg ?? 0,
				currency,
			),
		],
		[
			"Min",
			formatCurrency(
				categoriesWithStats?.stats.min ?? 0,
				currency,
			),
		],
		[
			"Max",
			formatCurrency(
				categoriesWithStats?.stats.max ?? 0,
				currency,
			),
		],
		[
			"Categories",
			String(categoriesWithStats?.stats.count ?? 0),
		],
		[
			"Expenses",
			String(categoriesWithStats?.stats.expenseCount ?? 0),
		],
	];

	return (
		<div className="flex gap-2 flex-col">
			<FilterBar
				variant="categories"
				buckets={buckets}
				categories={[]}
				owners={owners}
				sections={{
					categories: false,
					search: false,
				}}
			/>
			<div className="flex flex-wrap gap-2">
				{!categoriesWithStats
					? Array.from({ length: summaryCells.length }).map(
							(_, i) => (
								<Card key={i} className="min-w-[100px] flex-1">
									<Skeleton className="mb-1 h-4 w-16" />
									<Skeleton className="h-5 w-24" />
								</Card>
							),
						)
					: summaryCells.map(([label, value]) => (
							<Card key={label} className="min-w-[100px] flex-1">
								<p className="truncate text-xs text-[var(--color-muted)]">
									{label}
								</p>
								<p className="truncate font-medium tabular-nums">
									{value}
								</p>
							</Card>
						))}
			</div>

			<div className="grid grid-cols-1 gap-2">
				{items?.map((category) => {
					return (
						<div key={category._id}>
							<CategoryCard category={category} />
						</div>
					);
				})}
				{items?.length === 0 && (
					<p className="col-span-full text-center text-sm text-[var(--color-muted)] py-8">
						No categories found
					</p>
				)}
			</div>

			<AddCategoryDialog
				open={drawerOpen}
				onClose={() => setDrawerOpen(false)}
			/>
		</div>
	);
}
