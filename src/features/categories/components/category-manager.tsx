"use client";

import { useMemo, useState, useEffect } from "react";
import { FiPlus } from "react-icons/fi";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { FilterBar, useScopedOptions } from "@/components/filters";
import {
	useAppSelector,
	useAppDispatch,
} from "@/store/hooks";
import { fetchCategoriesWithStats } from "@/store/slices/categorySlice";
import { fetchAllBuckets } from "@/store/slices/bucketSlice";
import { CategoryCard } from "@/features/categories/components/category-card";
import { AddCategoryDialog } from "@/features/categories/components/add-category-dialog";
import { expensesApi } from "@/lib/api/expenses";
import { formatCurrency } from "@/lib/format";
import type { CategoryStatsSummary } from "@/types/analytics.types";

export function CategoryManager() {
	const dispatch = useAppDispatch();
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [summary, setSummary] =
		useState<CategoryStatsSummary | null>(null);

	const filterCriteria = useAppSelector(
		(s) => s.categoriesFilter.filterCriteria,
	);
	const sortCriteria = useAppSelector(
		(s) => s.categoriesFilter.sortCriteria,
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

	useEffect(() => {
		let cancelled = false;
		expensesApi
			.getCategoryStatsSummary(filterCriteria)
			.then((res) => {
				if (!cancelled) setSummary(res);
			})
			.catch(() => {
				if (!cancelled) setSummary(null);
			});
		return () => {
			cancelled = true;
		};
	}, [filterCriteria]);

	// ponytail: /categories/stats returns without an order, so amount sorting
	// is applied here against the fetched page.
	const items = useMemo(() => {
		const dir = sortCriteria.direction === "ASC" ? 1 : -1;
		return categoriesWithStats
			.slice()
			.sort((a, b) =>
				sortCriteria.field === "amount"
					? (a.total - b.total) * dir
					: a._id.localeCompare(b._id) * dir,
			);
	}, [categoriesWithStats, sortCriteria.field, sortCriteria.direction]);

	const summaryCells: Array<[string, string]> = [
		["Total", formatCurrency(summary?.total ?? 0, currency)],
		["Avg", formatCurrency(summary?.avg ?? 0, currency)],
		["Min", formatCurrency(summary?.min ?? 0, currency)],
		["Max", formatCurrency(summary?.max ?? 0, currency)],
		["Categories", String(summary?.categoryCount ?? 0)],
		["Expenses", String(summary?.expenseCount ?? 0)],
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
			<Card className="flex gap-2 justify-between items-center">
				<div className="flex flex-wrap gap-4">
					{summaryCells.map(([label, value]) => (
						<div key={label} className="min-w-2">
							<p className="truncate text-xs text-[var(--color-muted)]">
								{label}
							</p>
							<p className="truncate font-medium tabular-nums">
								{value}
							</p>
						</div>
					))}
				</div>
				<Button onClick={() => setDrawerOpen(true)}>
					<FiPlus className="h-4 w-4" />
				</Button>
			</Card>

			<div className="grid grid-cols-1 gap-2">
				{items.map((category) => {
					return (
						<div key={category._id}>
							<CategoryCard category={category} />
						</div>
					);
				})}
				{items.length === 0 && (
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
