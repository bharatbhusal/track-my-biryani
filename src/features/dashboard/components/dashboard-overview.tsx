"use client";

import { useState, useMemo, useEffect } from "react";

import { DateRangeBar } from "@/components/charts/date-range-bar";
import { ExpenseOverview } from "@/features/expenses/components/expense-overview";
import { DashboardBarChart } from "@/components/dashboard-bar-chart";
import { CategoryDistributionBar } from "@/features/expenses/components/category-distribution-bar";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchDashboard } from "@/store/slices/dashboardSlice";
import { fetchCategories } from "@/store/slices/categorySlice";
import { setDateRange } from "@/store/slices/uiSlice";
import { toRangeParams } from "@/lib/date-range";
import { getChartLabel } from "@/lib/format";

export function DashboardOverview() {
	const dispatch = useAppDispatch();
	const mainRange = useAppSelector((s) => s.ui.dateRange);
	const [selectedCategoryId, setSelectedCategoryId] =
		useState<string | undefined>();

	const categories = useAppSelector((s) => s.categories.items);
	const dashboardData = useAppSelector((s) => s.dashboard.data);
	const isDashboardLoading = useAppSelector((s) => s.dashboard.loading);

	const rangeParams = useMemo(
		() => toRangeParams(mainRange),
		[mainRange.preset, mainRange.offset],
	);

	useEffect(() => {
		dispatch(fetchCategories());
	}, [dispatch]);

	useEffect(() => {
		dispatch(fetchDashboard(rangeParams));
	}, [dispatch, rangeParams.preset, rangeParams.offset]);

	const categoryColorMap = useMemo(() => {
		const map = new Map<string, string>();
		categories.forEach((c) => {
			map.set(c.name, c.color);
		});
		return map;
	}, [categories]);

	const selectedCategoryName = useMemo(
		() =>
			selectedCategoryId
				? categories.find(
						(c) => c._id === selectedCategoryId,
					)?.name
				: undefined,
		[selectedCategoryId, categories],
	);

	const filteredStackedSeries = useMemo(() => {
		const series = dashboardData?.stackedSeries ?? [];
		if (!selectedCategoryName) return series;
		return series.map((item) => {
			const filtered: Record<string, string | number> = {
				name: item.name as string,
			};
			if (selectedCategoryName in item) {
				filtered[selectedCategoryName] =
					item[selectedCategoryName];
			}
			return filtered;
		});
	}, [dashboardData?.stackedSeries, selectedCategoryName]);

	const handleRangeChange = (range: typeof mainRange) => {
		dispatch(setDateRange(range));
		setSelectedCategoryId(undefined);
	};

	return (
		<div className="space-y-2">
			<DateRangeBar
				title={dashboardData?.periodLabel ?? "Overview"}
				range={mainRange}
				onRangeChange={handleRangeChange}
				loading={isDashboardLoading}
			/>
			<ExpenseOverview
				data={dashboardData ?? undefined}
				isLoading={isDashboardLoading}
			/>

			<CategoryDistributionBar
				distribution={dashboardData?.rankedCategories ?? []}
				categories={categories}
				selectedCategoryId={selectedCategoryId}
				onCategorySelect={setSelectedCategoryId}
				isLoading={isDashboardLoading}
			/>
			<DashboardBarChart
				stackedSeries={filteredStackedSeries}
				chartLabel={getChartLabel(mainRange.preset, "Expense")}
				averageSpend={dashboardData?.averageSpend}
				categoryColorMap={categoryColorMap}
				isLoading={isDashboardLoading}
			/>
		</div>
	);
}
