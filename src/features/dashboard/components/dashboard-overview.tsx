"use client";

import { useState, useMemo } from "react";

import { ExpenseOverview } from "@/features/expenses/components/expense-overview";
import { DashboardBarChart } from "@/components/dashboard-bar-chart";
import { DailyCashFlowChart } from "@/components/DailyCashFlowChart";
import { CategoryDistributionBar } from "@/features/expenses/components/category-distribution-bar";
import { useDashboardQuery } from "@/hooks/api/use-analytics-api";
import { useCategoriesQuery } from "@/hooks/api/use-expenses-api";
import { usePersistedRange } from "@/hooks/use-persisted-range";
import { toRangeParams } from "@/lib/date-range";

const CHART_COLORS = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
];

export function DashboardOverview() {
	const [mainRange, setMainRange] = usePersistedRange();
	const [selectedCategoryId, setSelectedCategoryId] =
		useState<string | undefined>();

	const categoriesQuery = useCategoriesQuery();
	const rangeParams = toRangeParams(mainRange);

	const { data: overviewData, isLoading: isOverviewLoading } =
		useDashboardQuery(rangeParams);

	const { data: chartData, isLoading: isChartLoading } = useDashboardQuery({
		...rangeParams,
		categoryId: selectedCategoryId || undefined,
	});

	const categoryColorMap = useMemo(() => {
		const map = new Map<string, string>();
		(categoriesQuery.data ?? []).forEach((c, i) => {
			map.set(
				c.name,
				c.color ?? CHART_COLORS[i % CHART_COLORS.length],
			);
		});
		return map;
	}, [categoriesQuery.data]);

	const handleRangeChange = (range: typeof mainRange) => {
		setMainRange(range);
		setSelectedCategoryId(undefined);
	};

	return (
		<div className="space-y-4">
			<ExpenseOverview
				data={overviewData}
				isLoading={isOverviewLoading}
				range={mainRange}
				onRangeChange={handleRangeChange}
			/>

			<CategoryDistributionBar
				distribution={overviewData?.rankedCategories ?? []}
				categories={categoriesQuery.data ?? []}
				selectedCategoryId={selectedCategoryId}
				onCategorySelect={setSelectedCategoryId}
				isLoading={isOverviewLoading}
			/>
			<DashboardBarChart
				stackedSeries={chartData?.stackedSeries ?? []}
				chartLabel={chartData?.chartLabel}
				averageSpend={chartData?.averageSpend}
				categoryColorMap={categoryColorMap}
				isLoading={isChartLoading}
			/>
			<DailyCashFlowChart
				stackedSeries={chartData?.stackedSeries ?? []}
				categoryColorMap={categoryColorMap}
				isLoading={isChartLoading}
			/>
		</div>
	);
}
