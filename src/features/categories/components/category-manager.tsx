"use client";

import { useMemo, useState, useEffect } from "react";
import {
	FiPlus,
	FiSearch,
	FiArrowUp,
	FiArrowDown,
	FiTag,
} from "react-icons/fi";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchCategories } from "@/store/slices/categorySlice";
import { fetchDashboardData } from "@/store/slices/dashboardSlice";
import { setDateRange } from "@/store/slices/uiSlice";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { Input } from "@/components/ui/input";
import { DateRangeBar } from "@/components/charts/date-range-bar";
import { CategoryCard } from "@/features/categories/components/category-card";
import { AddCategoryDrawer } from "@/features/categories/components/add-category-drawer";

export function CategoryManager() {
	const dispatch = useAppDispatch();
	const [query, setQuery] = useState("");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
		"desc",
	);
	const [drawerOpen, setDrawerOpen] = useState(false);

	const range = useAppSelector((s) => s.ui.dateRange);
	const categories = useAppSelector((s) => s.categories.items);
	const dashboardExpenses = useAppSelector((s) => s.dashboard.expenses);
	const dashboardCategories = useAppSelector((s) => s.dashboard.categories);

	const debouncedQuery = useDebouncedValue(query, 300);

	useEffect(() => {
		dispatch(fetchCategories());
	}, [dispatch]);

	useEffect(() => {
		dispatch(fetchDashboardData(range));
	}, [dispatch, range.preset, range.offset]);

	const categorySpendMap = useMemo(() => {
		const map = new Map<
			string,
			{ amount: number; pct: number }
		>();
		const totals = new Map<string, number>();
		let total = 0;
		for (const expense of dashboardExpenses) {
			totals.set(
				expense.categoryId,
				(totals.get(expense.categoryId) ?? 0) + expense.amount,
			);
			total += expense.amount;
		}
		const categoryNameById = new Map(
			dashboardCategories.map((c) => [c._id, c.name]),
		);
		for (const [catId, amount] of totals) {
			const name = categoryNameById.get(catId) ?? "Uncategorized";
			map.set(name, {
				amount,
				pct: total > 0 ? (amount / total) * 100 : 0,
			});
		}
		return map;
	}, [dashboardExpenses, dashboardCategories]);

	const items = useMemo(
		() =>
			categories
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
			categories,
			debouncedQuery,
			sortOrder,
			categorySpendMap,
		],
	);

	return (
		<div className="flex gap-2 flex-col">
			<DateRangeBar
				range={range}
				onRangeChange={(r) => dispatch(setDateRange(r))}
			/>
			<Card>
				<div className="flex items-center justify-between mb-4">
					<CardTitle>
						<FiTag className="inline mr-1.5 h-4 w-4" />
						Categories
					</CardTitle>
				</div>

				<div className="grid grid-cols-1 gap-2">
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
			</Card>

			<div className="grid grid-cols-1 gap-2">
				{items.map((category) => {
					const spend = categorySpendMap.get(category.name);
					const totalSpend = Array.from(categorySpendMap.values()).reduce(
						(sum, v) => sum + v.amount,
						0,
					);
					return (
						<div key={category._id}>
							<CategoryCard
								category={category}
								amount={spend?.amount}
								totalSpend={totalSpend}
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
		</div>
	);
}
