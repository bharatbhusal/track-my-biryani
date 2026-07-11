"use client";

import { useState, useMemo, useEffect } from "react";

import { DateRangeBar } from "@/components/charts/date-range-bar";
import { ExpenseOverview } from "@/features/expenses/components/expense-overview";
import { DashboardBarChart } from "@/components/dashboard-bar-chart";
import { CategoryDistributionBar } from "@/features/expenses/components/category-distribution-bar";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchDashboardData } from "@/store/slices/dashboardSlice";
import { setDateRange } from "@/store/slices/uiSlice";
import { getChartLabel } from "@/lib/format";
import {
	selectTotalSpend,
	selectRankedCategories,
	selectStackedSeries,
	selectPeriodLabel,
	selectAverageSpend,
	selectCards,
	selectDashboardIsLoading,
} from "@/store/selectors/dashboard.selectors";

export function DashboardOverview() {
	const dispatch = useAppDispatch();
	const mainRange = useAppSelector((s) => s.ui.dateRange);
	const [selectedCategoryId, setSelectedCategoryId] =
		useState<string | undefined>();

	const categories = useAppSelector((s) => s.dashboard.categories);
	const isLoading = useAppSelector(selectDashboardIsLoading);
	const totalSpend = useAppSelector(selectTotalSpend);
	const rankedCategories = useAppSelector(selectRankedCategories);
	const stackedSeries = useAppSelector((s) =>
		selectStackedSeries(s, mainRange),
	);
	const periodLabel = useAppSelector((s) =>
		selectPeriodLabel(s, mainRange),
	);
	const averageSpend = useAppSelector((s) =>
		selectAverageSpend(s, mainRange),
	);
	const cards = useAppSelector((s) =>
		selectCards(s, mainRange),
	);

	useEffect(() => {
		dispatch(fetchDashboardData(mainRange));
	}, [dispatch, mainRange.preset, mainRange.offset]);

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
		if (!selectedCategoryName) return stackedSeries;
		return stackedSeries.map((item) => {
			const filtered: Record<string, string | number> = {
				name: item.name as string,
			};
			if (selectedCategoryName in item) {
				filtered[selectedCategoryName] =
					item[selectedCategoryName];
			}
			return filtered;
		});
	}, [stackedSeries, selectedCategoryName]);

	const handleRangeChange = (range: typeof mainRange) => {
		dispatch(setDateRange(range));
		setSelectedCategoryId(undefined);
	};

	const overviewData = useMemo(
		() =>
			totalSpend > 0
				? {
						totalSpend,
						averageSpend,
						cards,
						chartLabel: "",
						rankedCategories,
						stackedSeries,
						periodLabel,
					}
				: undefined,
		[
			totalSpend,
			averageSpend,
			cards,
			rankedCategories,
			stackedSeries,
			periodLabel,
		],
	);

	return (
		<div className="space-y-2">
			<DateRangeBar
				title={periodLabel}
				range={mainRange}
				onRangeChange={handleRangeChange}
				loading={isLoading}
			/>
			<ExpenseOverview
				data={overviewData}
				isLoading={isLoading}
			/>

			<CategoryDistributionBar
				distribution={rankedCategories}
				categories={categories}
				selectedCategoryId={selectedCategoryId}
				onCategorySelect={setSelectedCategoryId}
				isLoading={isLoading}
			/>
			<DashboardBarChart
				stackedSeries={filteredStackedSeries}
				chartLabel={getChartLabel(mainRange.preset, "Expense")}
				averageSpend={averageSpend}
				categoryColorMap={categoryColorMap}
				isLoading={isLoading}
			/>
		</div>
	);
}
