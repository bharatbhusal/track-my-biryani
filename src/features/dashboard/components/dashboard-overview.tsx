"use client";

import { useState, useMemo, useEffect } from "react";

import { DateRangeBar } from "@/components/charts/date-range-bar";
import { ExpenseOverview } from "@/features/expenses/components/expense-overview";
import { DashboardBarChart } from "@/components/dashboard-bar-chart";
import { CategoryDistributionBar } from "@/features/expenses/components/category-distribution-bar";
import {
	useAppSelector,
	useAppDispatch,
} from "@/store/hooks";
import {
	fetchOverviewStats,
	fetchChartData,
} from "@/store/slices/expenseSlice";
import { fetchCategoryDistribution } from "@/store/slices/categorySlice";
import { setDateRange } from "@/store/slices/uiSlice";
import { getChartLabel } from "@/lib/format";
import {
	toRangeDates,
	computePeriodLabel,
	toIsoBounds,
} from "@/lib/date-range";

export function DashboardOverview() {
	const dispatch = useAppDispatch();
	const mainRange = useAppSelector((s) => s.ui.dateRange);
	const [selectedCategoryId, setSelectedCategoryId] =
		useState<string | undefined>();

	const distribution = useAppSelector(
		(s) => s.categories.distribution,
	);
	const overviewStats = useAppSelector(
		(s) => s.expenses.overviewStats,
	);
	const chartData = useAppSelector(
		(s) => s.expenses.chartData,
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
			}),
		);
		dispatch(
			fetchCategoryDistribution({
				from: isoBounds.from,
				to: isoBounds.to,
			}),
		);
	}, [dispatch, isoBounds.from, isoBounds.to]);

	useEffect(() => {
		if (!isoBounds.from || !isoBounds.to) return;
		dispatch(
			fetchChartData({
				from: isoBounds.from,
				to: isoBounds.to,
				categoryId: selectedCategoryId,
			}),
		);
	}, [
		dispatch,
		isoBounds.from,
		isoBounds.to,
		selectedCategoryId,
	]);

	const periodLabel = useMemo(
		() => computePeriodLabel(from, to, mainRange.preset),
		[from, to, mainRange.preset],
	);

	const handleRangeChange = (range: typeof mainRange) => {
		dispatch(setDateRange(range));
		setSelectedCategoryId(undefined);
	};

	return (
		<div className="space-y-2">
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
				onCategorySelect={setSelectedCategoryId}
				isLoading={isLoading}
			/>
			<DashboardBarChart
				stackedSeries={chartData?.series ?? []}
				chartLabel={getChartLabel(mainRange.preset, "Expense")}
				averageSpend={chartData?.stats.avg}
				minSpend={chartData?.stats.min}
				maxSpend={chartData?.stats.max}
				categoryColorMap={chartData?.categoryColors ?? {}}
				isLoading={isLoading}
			/>
		</div>
	);
}
