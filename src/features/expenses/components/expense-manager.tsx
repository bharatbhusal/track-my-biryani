"use client";

import { useMemo, useState, useEffect } from "react";
import { FiList, FiSearch } from "react-icons/fi";
import { useDebouncedValue } from "@/hooks/use-debounce";

import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchCategories, fetchCategoryDistribution } from "@/store/slices/categorySlice";
import { fetchExpenses } from "@/store/slices/expenseSlice";
import { setDateRange } from "@/store/slices/uiSlice";
import {
	toIsoBounds,
} from "@/lib/date-range";
import type { GlobalDateRange } from "@/lib/date-range";

import { DateRangeBar } from "@/components/charts/date-range-bar";
import { ExpenseTable } from "@/features/expenses/components/expense-table";
import type { SortField } from "@/features/expenses/components/expense-table";
import { CategoryDistributionBar } from "@/features/expenses/components/category-distribution-bar";

export function ExpenseManager() {
	const dispatch = useAppDispatch();
	const [query, setQuery] = useState("");
	const [categoryId, setCategoryId] = useState("");
	const [sortBy, setSortBy] = useState<SortField>("paidAt");
	const [order, setOrder] = useState<"asc" | "desc">("desc");
	const [page, setPage] = useState(1);

	const localRange = useAppSelector((s) => s.ui.dateRange);
	const items = useAppSelector((s) => s.expenses.items);
	const isLoading = useAppSelector((s) => s.expenses.loading);
	const totalPages = useAppSelector((s) => s.expenses.totalPages);

	const debouncedQuery = useDebouncedValue(query, 300);

	const distribution = useAppSelector((s) => s.categories.distribution);

	const rangeBounds = useMemo(
		() => toIsoBounds(localRange),
		[localRange.preset, localRange.offset],
	);

	useEffect(() => {
		dispatch(fetchCategories());
	}, [dispatch]);

	useEffect(() => {
		dispatch(
			fetchExpenses({
				page,
				limit: 10,
				q: debouncedQuery || undefined,
				categoryId: categoryId || undefined,
				from: rangeBounds.from,
				to: rangeBounds.to,
				sortBy,
				order,
			}),
		);
	}, [
		dispatch,
		page,
		debouncedQuery,
		categoryId,
		rangeBounds.from,
		rangeBounds.to,
		sortBy,
		order,
	]);

	useEffect(() => {
		if (!rangeBounds.from || !rangeBounds.to) return;
		dispatch(fetchCategoryDistribution({ from: rangeBounds.from, to: rangeBounds.to }));
	}, [dispatch, rangeBounds.from, rangeBounds.to]);

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
		dispatch(setDateRange(range));
		setCategoryId("");
		setPage(1);
	};

	return (
		<div className="flex flex-1 min-h-0 flex-col gap-2 overflow-hidden">
			<DateRangeBar
				range={localRange}
				onRangeChange={handleRangeChange}
			/>

			<Card className="shrink-0">
				<div className="mb-3 flex items-center justify-between gap-2">
					<CardTitle>
						<FiList className="mr-1.5 inline h-4 w-4" />
						Expenses
					</CardTitle>
				</div>

				<div className="relative min-w-48 flex-1">
					<FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
					<Input
						placeholder="Search title, notes, ..."
						value={query}
						className="pl-9"
						onChange={(e) => {
							setQuery(e.target.value);
							setPage(1);
						}}
					/>
				</div>
			</Card>

			<div className="shrink-0">
				<CategoryDistributionBar
					distribution={distribution}
					selectedCategoryId={categoryId || undefined}
					onCategorySelect={handleCategorySelect}
					isLoading={isLoading}
				/>
			</div>
			<div className="min-h-0 flex-1 overflow-auto">
				<ExpenseTable
					items={items}
					isLoading={isLoading}
					sortBy={sortBy}
					order={order}
					onSort={handleSort}
					page={page}
					totalPages={totalPages}
					onPageChange={setPage}
				/>
			</div>
		</div>
	);
}
