"use client";

import { useState } from "react";

import { ExpenseOverview } from "@/features/expenses/components/expense-overview";
import { DashboardBarChart } from "@/components/dashboard-bar-chart";
import { DailyCashFlowChart } from "@/components/DailyCashFlowChart";
import { CategoryDistributionBar } from "@/features/expenses/components/category-distribution-bar";
import { DEFAULT_GLOBAL_RANGE } from "@/lib/date-range";
import type { GlobalDateRange } from "@/lib/date-range";

export function DashboardOverview() {
	const [mainRange, setMainRange] =
		useState<GlobalDateRange>(DEFAULT_GLOBAL_RANGE);
	const [selectedCategoryId, setSelectedCategoryId] =
		useState<string | undefined>();

	return (
		<div className="space-y-4">
			<ExpenseOverview
				range={mainRange}
				onRangeChange={(range) => {
					setMainRange(range);
					setSelectedCategoryId(undefined);
				}}
			/>

			<CategoryDistributionBar
				range={mainRange}
				selectedCategoryId={selectedCategoryId}
				onCategorySelect={setSelectedCategoryId}
			/>
			<DashboardBarChart
				range={mainRange}
				selectedCategoryId={selectedCategoryId}
			/>
			<DailyCashFlowChart
				range={mainRange}
				selectedCategoryId={selectedCategoryId}
			/>
		</div>
	);
}
