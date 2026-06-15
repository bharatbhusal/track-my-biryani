"use client";

import { useMemo, useState } from "react";
import {
	FiPlus,
	FiSearch,
	FiArrowUp,
	FiArrowDown,
	FiTag,
} from "react-icons/fi";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { useCategoriesQuery } from "@/hooks/api/use-expenses-api";
import { useDashboardQuery } from "@/hooks/api/use-analytics-api";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { Input } from "@/components/ui/input";
import { DateRangeSelect } from "@/components/charts/date-range-select";
import { CategoryCard } from "@/features/categories/components/category-card";
import { AddCategoryDrawer } from "@/features/categories/components/add-category-drawer";
import { DEFAULT_GLOBAL_RANGE } from "@/lib/date-range";
import type { GlobalDateRange } from "@/lib/date-range";

export function CategoryManager() {
	const [query, setQuery] = useState("");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
		"asc",
	);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [range, setRange] = useState<GlobalDateRange>(
		DEFAULT_GLOBAL_RANGE,
	);
	const categoriesQuery = useCategoriesQuery();
	const { data: dashboardData } = useDashboardQuery({
		preset: range.preset,
	});
	const debouncedQuery = useDebouncedValue(query, 300);

	const categorySpendMap = useMemo(() => {
		const map = new Map<
			string,
			{ amount: number; pct: number }
		>();
		const ranked = dashboardData?.rankedCategories ?? [];
		const total = dashboardData?.totalSpend ?? 0;
		for (const cat of ranked) {
			map.set(cat.name, {
				amount: cat.value,
				pct: total > 0 ? (cat.value / total) * 100 : 0,
			});
		}
		return map;
	}, [dashboardData]);

	const items = useMemo(
		() =>
			(categoriesQuery.data ?? [])
				.filter((item) =>
					item.name
						.toLowerCase()
						.includes(debouncedQuery.toLowerCase()),
				)
				.sort((a, b) => {
					const aSpend =
						categorySpendMap.get(a.name)?.amount ?? 0;
					const bSpend =
						categorySpendMap.get(b.name)?.amount ?? 0;
					if (sortOrder === "asc") return aSpend - bSpend;
					return bSpend - aSpend;
				}),
		[
			categoriesQuery.data,
			debouncedQuery,
			sortOrder,
			categorySpendMap,
		],
	);

	return (
		<Card>
			<div className="flex items-center justify-between gap-2 mb-4">
				<CardTitle>
					<FiTag className="inline mr-1.5 h-4 w-4" />
					Categories
				</CardTitle>
				<div className="flex items-center gap-2">
					<DateRangeSelect value={range} onChange={setRange} />
				</div>
			</div>

			<div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
				<div className="relative">
					<FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted)]" />
					<Input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search categories"
						className="pl-9"
					/>
				</div>
				<div className="flex w-full items-center justify-between">
					<Button
						variant="outline"
						onClick={() =>
							setSortOrder((c) => (c === "asc" ? "desc" : "asc"))
						}
					>
						{sortOrder === "asc" ? (
							<FiArrowUp className="mr-1.5 h-4 w-4" />
						) : (
							<FiArrowDown className="mr-1.5 h-4 w-4" />
						)}
						Sort {sortOrder === "asc" ? "Lowest" : "Highest"}
					</Button>
					<Button onClick={() => setDrawerOpen(true)}>
						<FiPlus className="mr-1.5 h-4 w-4" />
						Add Category
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
				{items.map((category) => {
					const spend = categorySpendMap.get(category.name);
					return (
						<div key={category._id}>
							<CategoryCard
								category={category}
								amount={spend?.amount}
								totalSpend={dashboardData?.totalSpend}
							/>
						</div>
					);
				})}
				{items.length === 0 && (
					<p className="col-span-full text-center text-sm text-[var(--color-muted)] py-8">
						No categories found
					</p>
				)}
			</div>

			<AddCategoryDrawer
				open={drawerOpen}
				onClose={() => setDrawerOpen(false)}
			/>
		</Card>
	);
}
