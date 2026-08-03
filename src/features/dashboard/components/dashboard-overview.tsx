"use client";

import { useState, useMemo, useEffect } from "react";
import { FiSearch, FiX } from "react-icons/fi";

import { DateRangeBar } from "@/components/charts/date-range-bar";
import { BucketSwitcher } from "@/components/layout/bucket-switcher";
import { ExpenseOverview } from "@/features/expenses/components/expense-overview";
import { DashboardBarChart } from "@/components/dashboard-bar-chart";
import { CategoryDistributionBar } from "@/features/expenses/components/category-distribution-bar";
import { ExpenseTable } from "@/features/expenses/components/expense-table";
import type { SortField } from "@/features/expenses/components/expense-table";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
	useAppSelector,
	useAppDispatch,
} from "@/store/hooks";
import {
	fetchOverviewStats,
	fetchChartData,
	fetchExpenses,
} from "@/store/slices/expenseSlice";
import { fetchCategoryDistribution } from "@/store/slices/categorySlice";
import { setDateRange } from "@/store/slices/uiSlice";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { getChartLabel } from "@/lib/format";
import {
	toRangeDates,
	computePeriodLabel,
	toIsoBounds,
} from "@/lib/date-range";

export function DashboardOverview() {
	const dispatch = useAppDispatch();
	const mainRange = useAppSelector((s) => s.ui.dateRange);
	const activeBucketId = useAppSelector(
		(s) => s.ui.activeBucketId,
	);
	const [selectedCategoryId, setSelectedCategoryId] =
		useState<string | undefined>();
	const [query, setQuery] = useState("");
	const [sortBy, setSortBy] = useState<SortField>("paidAt");
	const [order, setOrder] = useState<"asc" | "desc">("desc");
	const [page, setPage] = useState(1);

	const debouncedQuery = useDebouncedValue(query, 300);

	const distribution = useAppSelector(
		(s) => s.categories.distribution,
	);
	const overviewStats = useAppSelector(
		(s) => s.expenses.overviewStats,
	);
	const chartData = useAppSelector(
		(s) => s.expenses.chartData,
	);
	const items = useAppSelector((s) => s.expenses.items);
	const totalPages = useAppSelector(
		(s) => s.expenses.totalPages,
	);
	const isLoading = useAppSelector(
		(s) => s.expenses.loading,
	);

	const { from, to } = useMemo(
		() => toRangeDates(mainRange),
		[mainRange.preset, mainRange.offset],
	);

	const isoBounds = useMemo(
		() => toIsoBounds(mainRange),
		[mainRange.preset, mainRange.offset],
	);

	useEffect(() => {
		if (!isoBounds.from || !isoBounds.to) return;
		dispatch(
			fetchOverviewStats({
				from: isoBounds.from,
				to: isoBounds.to,
				bucketId: activeBucketId ?? undefined,
			}),
		);
		dispatch(
			fetchCategoryDistribution({
				from: isoBounds.from,
				to: isoBounds.to,
				bucketId: activeBucketId ?? undefined,
			}),
		);
	}, [
		dispatch,
		isoBounds.from,
		isoBounds.to,
		activeBucketId,
	]);

	useEffect(() => {
		if (!isoBounds.from || !isoBounds.to) return;
		dispatch(
			fetchChartData({
				from: isoBounds.from,
				to: isoBounds.to,
				categoryId: selectedCategoryId,
				bucketId: activeBucketId ?? undefined,
			}),
		);
	}, [
		dispatch,
		isoBounds.from,
		isoBounds.to,
		selectedCategoryId,
		activeBucketId,
	]);

	useEffect(() => {
		if (!isoBounds.from || !isoBounds.to) return;
		dispatch(
			fetchExpenses({
				page,
				limit: 10,
				q: debouncedQuery || undefined,
				categoryId: selectedCategoryId,
				from: isoBounds.from,
				to: isoBounds.to,
				sortBy,
				order,
				bucketId: activeBucketId ?? undefined,
			}),
		);
	}, [
		dispatch,
		page,
		debouncedQuery,
		selectedCategoryId,
		isoBounds.from,
		isoBounds.to,
		sortBy,
		order,
		activeBucketId,
	]);

	const periodLabel = useMemo(
		() => computePeriodLabel(from, to, mainRange.preset),
		[from, to, mainRange.preset],
	);

	const averageSpend = useMemo(
		() =>
			overviewStats?.find((card) => card.key !== "total_spend")
				?.value,
		[overviewStats],
	);

	const handleRangeChange = (range: typeof mainRange) => {
		dispatch(setDateRange(range));
		setSelectedCategoryId(undefined);
		setPage(1);
	};

	const handleSort = (field: SortField) => {
		if (sortBy === field) {
			setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
		} else {
			setSortBy(field);
			setOrder("desc");
		}
		setPage(1);
	};

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between gap-2 px-2">
				<h2 className="text-lg font-semibold tracking-tight">
					Dashboard
				</h2>
				<div className="w-40 shrink-0">
					<BucketSwitcher
						onChange={() => {
							setPage(1);
							setSelectedCategoryId(undefined);
						}}
					/>
				</div>
			</div>
			<DateRangeBar
				title={periodLabel}
				range={mainRange}
				onRangeChange={handleRangeChange}
				loading={isLoading}
			/>
			<ExpenseOverview
				data={overviewStats}
				isLoading={isLoading}
			/>

			<CategoryDistributionBar
				distribution={distribution}
				selectedCategoryId={selectedCategoryId}
				onCategorySelect={(id) => {
					setSelectedCategoryId(id);
					setPage(1);
				}}
				isLoading={isLoading}
			/>
			<DashboardBarChart
				stackedSeries={chartData?.series ?? []}
				chartLabel={getChartLabel(mainRange.preset, "Expense")}
				averageSpend={averageSpend}
				categoryColorMap={chartData?.categoryColors ?? {}}
				isLoading={isLoading}
			/>

			<div className="relative min-w-48 flex-1">
				<FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
				<Input
					placeholder="Search title, notes, ..."
					value={query}
					className={cn("pl-9", query && "pr-9")}
					onChange={(e) => {
						setQuery(e.target.value);
						setPage(1);
					}}
				/>
				{query ? (
					<button
						type="button"
						aria-label="Clear search"
						onClick={() => {
							setQuery("");
							setPage(1);
						}}
						className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
					>
						<FiX className="h-4 w-4" />
					</button>
				) : null}
			</div>

			<ExpenseTable
				items={items}
				isLoading={isLoading}
				sortBy={sortBy}
				order={order}
				onSort={handleSort}
				page={page}
				totalPages={totalPages}
				onPageChange={setPage}
				showPoster={Boolean(activeBucketId)}
			/>
		</div>
	);
}
