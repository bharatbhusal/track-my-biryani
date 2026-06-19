"use client";

import { useState, useMemo } from "react";

import { ExpenseOverview } from "@/features/expenses/components/expense-overview";
import { DashboardBarChart } from "@/components/dashboard-bar-chart";
import { CashFlowChart } from "@/components/cash-flow-chart";
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
	} = useDashboardQuery({
		...rangeParams,
		categoryId: selectedCategoryId || undefined,
	});

	const categoryColorMap = useMemo(() => {
		const map = new Map<string, string>();
		(categoriesQuery.data ?? []).forEach((c, i) => {
			map.set(c.name, c.color);
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
				data={dashboardData}
				isLoading={isDashboardLoading}
				range={mainRange}
				onRangeChange={handleRangeChange}
			/>

			<CategoryDistributionBar
				distribution={dashboardData?.rankedCategories ?? []}
				categories={categoriesQuery.data ?? []}
				selectedCategoryId={selectedCategoryId}
				onCategorySelect={setSelectedCategoryId}
				isLoading={isDashboardLoading}
			/>
			<DashboardBarChart
				stackedSeries={dashboardData?.stackedSeries ?? []}
				chartLabel={getChartLabel(mainRange.preset, "Expense")}
				averageSpend={dashboardData?.averageSpend}
				categoryColorMap={categoryColorMap}
				isLoading={isDashboardLoading}
			/>
			<CashFlowChart
				title={getChartLabel(mainRange.preset, "Cash Flow")}
				stackedSeries={dashboardData?.stackedSeries ?? []}
				categoryColorMap={categoryColorMap}
				isLoading={isDashboardLoading}
			/>
		</div>
	);
}
