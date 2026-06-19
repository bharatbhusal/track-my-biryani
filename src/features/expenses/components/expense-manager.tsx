"use client";

import { useMemo, useState } from "react";
import { FiList, FiSearch } from "react-icons/fi";
import { useDebouncedValue } from "@/hooks/use-debounce";

import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	useCategoriesQuery,
	useExpensesQuery,
} from "@/hooks/api/use-expenses-api";
import { useDashboardQuery } from "@/hooks/api/use-analytics-api";
import { usePersistedRange } from "@/hooks/use-persisted-range";
import { toIsoBounds, toRangeParams } from "@/lib/date-range";
import type { GlobalDateRange } from "@/lib/date-range";

import { ExpenseTable } from "@/features/expenses/components/expense-table";
import type { SortField } from "@/features/expenses/components/expense-table";
import { CategoryDistributionBar } from "@/features/expenses/components/category-distribution-bar";
import { DateRangeSelect } from "@/components/charts/date-range-select";

export function ExpenseManager() {
	const [query, setQuery] = useState("");
	const [categoryId, setCategoryId] = useState("");
	const [sortBy, setSortBy] = useState<SortField>("paidAt");
	const [order, setOrder] = useState<"asc" | "desc">("desc");
	const [page, setPage] = useState(1);
	const [localRange, setLocalRange] =
		usePersistedRange();

	const categoriesQuery = useCategoriesQuery();
	const rangeParams = toRangeParams(localRange);
	const { data: dashboardData } = useDashboardQuery(rangeParams);
	const debouncedQuery = useDebouncedValue(query, 300);

	const filters = useMemo(() => {
		const bounds = toIsoBounds(localRange);
		return {
			page,
			limit: 10,
			q: debouncedQuery || undefined,
			categoryId: categoryId || undefined,
			from: bounds.from,
			to: bounds.to,
			sortBy,
			order,
		};
	}, [
		categoryId,
		localRange,
		order,
		page,
		debouncedQuery,
		sortBy,
	]);

	const expensesQuery = useExpensesQuery(filters);
	const isLoading = expensesQuery.isLoading;
	const items = expensesQuery.data?.items ?? [];
	const totalPages = expensesQuery.data?.totalPages ?? 1;

	const categoryMap = useMemo(
		() =>
			new Map(
				(categoriesQuery.data ?? []).map((cat) => [
					cat._id,
					cat,
				]),
			),
		[categoriesQuery.data],
	);

	const handleSort = (field: SortField) => {
		if (sortBy === field) {
			setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
		} else {
			setSortBy(field);
			setOrder("desc");
		}
		setPage(1);
	};

	const handleCategorySelect = (id: string | undefined) => {
		setCategoryId(id ?? "");
		setPage(1);
	};

	const handleRangeChange = (range: GlobalDateRange) => {
		setLocalRange(range);
		setCategoryId("");
		setPage(1);
	};

	return (
		<div className="space-y-4">
			<Card>
				<div className="mb-3 flex items-center justify-between gap-2">
					<CardTitle>
						<FiList className="inline mr-1.5 h-4 w-4" />
						Expenses
					</CardTitle>
					<DateRangeSelect
						value={localRange}
						onChange={(r) => handleRangeChange(r)}
					/>
				</div>

				<div className="relative min-w-48 flex-1">
					<FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted)]" />
					<Input
						placeholder="Search title, notes, payment..."
						value={query}
						className="pl-9"
						onChange={(e) => {
							setQuery(e.target.value);
							setPage(1);
						}}
					/>
				</div>
			</Card>

			<CategoryDistributionBar
				distribution={dashboardData?.rankedCategories ?? []}
				categories={categoriesQuery.data ?? []}
				selectedCategoryId={categoryId || undefined}
				onCategorySelect={handleCategorySelect}
				isLoading={!dashboardData}
			/>

			<ExpenseTable
				items={items}
				categoryMap={categoryMap}
				isLoading={isLoading}
				sortBy={sortBy}
				order={order}
				onSort={handleSort}
				page={page}
				totalPages={totalPages}
				onPageChange={setPage}
			/>
		</div>
	);
}
