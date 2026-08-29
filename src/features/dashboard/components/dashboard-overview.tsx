"use client";

import { useMemo, useEffect } from "react";

import {
	FilterBar,
	useScopedOptions,
	sortForVariant,
} from "@/components/filters";
import { ExpenseOverview } from "@/features/expenses/components/expense-overview";
import { DashboardBarChart } from "@/components/dashboard-bar-chart";
import { ExpenseTable } from "@/features/expenses/components/expense-table";
import type { SortField } from "@/features/expenses/components/expense-table";
import {
	useAppSelector,
	useAppDispatch,
} from "@/store/hooks";
import {
	fetchOverviewStats,
	fetchChartData,
	fetchExpenses,
} from "@/store/slices/expenseSlice";
import { fetchAllBuckets } from "@/store/slices/bucketSlice";
import {
	setSort,
	setPage,
} from "@/store/slices/filtersSlice";
import { getChartLabel } from "@/lib/format";
import { chartGranularity } from "@/lib/filters";

export function DashboardOverview() {
	const dispatch = useAppDispatch();

	const filterCriteria = useAppSelector(
		(s) => s.filters.expenses.filterCriteria,
	);
	const sortCriteria = useAppSelector(
		(s) => s.filters.expenses.sortCriteria,
	);
	const pagination = useAppSelector(
		(s) => s.filters.expenses.pagination,
	);

	const buckets = useAppSelector((s) => s.buckets.allBuckets);
	const overviewStats = useAppSelector(
		(s) => s.expenses.overviewStats,
	);
	const chartData = useAppSelector((s) => s.expenses.chartData);
	const items = useAppSelector((s) => s.expenses.items);
	const totalPages = useAppSelector((s) => s.expenses.totalPages);
	const isLoading = useAppSelector((s) => s.expenses.loading);

	const { categories, owners } = useScopedOptions(
		true,
		buckets,
		filterCriteria.bucketPreset,
		filterCriteria.bucketIds,
	);

	useEffect(() => {
		dispatch(fetchAllBuckets());
	}, [dispatch]);

	useEffect(() => {
		dispatch(fetchOverviewStats());
	}, [dispatch, filterCriteria]);

	useEffect(() => {
		dispatch(fetchChartData());
	}, [dispatch, filterCriteria]);

	useEffect(() => {
		dispatch(fetchExpenses());
	}, [dispatch, filterCriteria, sortCriteria, pagination]);

	const averageSpend = useMemo(
		() =>
			overviewStats?.find((card) => card.key !== "total_spend")
				?.value,
		[overviewStats],
	);

	const effectiveSort = sortForVariant("expenses", sortCriteria);

	const handleSort = (field: SortField) => {
		dispatch(
			setSort({
				variant: "expenses",
				field,
				direction:
					effectiveSort.field === field &&
					effectiveSort.direction === "DESC"
						? "ASC"
						: "DESC",
			}),
		);
	};

	return (
		<div className="space-y-2">
			<FilterBar
				variant="expenses"
				buckets={buckets}
				categories={categories}
				owners={owners}
			/>

			<ExpenseOverview data={overviewStats} isLoading={isLoading} />

			<DashboardBarChart
				stackedSeries={chartData?.series ?? []}
				chartLabel={getChartLabel(
					chartGranularity(filterCriteria.datePreset),
					"Expense",
				)}
				averageSpend={averageSpend}
				categoryColorMap={chartData?.categoryColors ?? {}}
				isLoading={isLoading}
			/>

			<ExpenseTable
				items={items}
				isLoading={isLoading}
				sortBy={effectiveSort.field as SortField}
				order={effectiveSort.direction === "ASC" ? "asc" : "desc"}
				onSort={handleSort}
				page={pagination.page}
				totalPages={totalPages}
				onPageChange={(p) =>
					dispatch(setPage({ variant: "expenses", page: p }))
				}
				isSection={effectiveSort.field === "paidAt"}
			/>
		</div>
	);
}
