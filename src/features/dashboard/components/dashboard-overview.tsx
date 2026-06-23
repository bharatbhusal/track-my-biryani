"use client";

import { useState, useMemo } from "react";

import { DateRangeBar } from "@/components/charts/date-range-bar";
import { ExpenseOverview } from "@/features/expenses/components/expense-overview";
import { DashboardBarChart } from "@/components/dashboard-bar-chart";
import { CategoryDistributionBar } from "@/features/expenses/components/category-distribution-bar";
import { useDashboardQuery } from "@/hooks/api/use-analytics-api";
import { useCategoriesQuery } from "@/hooks/api/use-expenses-api";
import { usePersistedRange } from "@/hooks/use-persisted-range";
import { toRangeParams } from "@/lib/date-range";
import { getChartLabel } from "@/lib/format";

export function DashboardOverview() {
	const [mainRange, setMainRange] = usePersistedRange();
	const [selectedCategoryId, setSelectedCategoryId] =
		useState<string | undefined>();

	const categoriesQuery = useCategoriesQuery();
	const rangeParams = toRangeParams(mainRange);

	const {
		data: dashboardData,
		isLoading: isDashboardLoading,
	} = useDashboardQuery(rangeParams);

	const categoryColorMap = useMemo(() => {
		const map = new Map<string, string>();
		(categoriesQuery.data ?? []).forEach((c, i) => {
			map.set(c.name, c.color);
		});
		return map;
	}, [categoriesQuery.data]);

	const selectedCategoryName = useMemo(
		() =>
			selectedCategoryId
				? categoriesQuery.data?.find(
						(c) => c._id === selectedCategoryId,
					)?.name
				: undefined,
		[selectedCategoryId, categoriesQuery.data],
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
		setMainRange(range);
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
				data={dashboardData}
				isLoading={isDashboardLoading}
			/>

			<CategoryDistributionBar
				distribution={dashboardData?.rankedCategories ?? []}
				categories={categoriesQuery.data ?? []}
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
