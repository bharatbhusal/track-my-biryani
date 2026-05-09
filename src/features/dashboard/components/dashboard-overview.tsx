"use client";

import { ExportableChart } from "@/components/charts/exportable-chart";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import { MonthlyLineChart } from "@/components/charts/monthly-line-chart";
import { WeeklyBarChart } from "@/components/charts/weekly-bar-chart";
import { useState } from "react";
import { TimeRangeSelector } from "@/components/charts/time-range-selector";
import { Card, CardTitle } from "@/components/ui/card";
import { useDashboardQuery } from "@/hooks/api/use-analytics-api";
import { formatCurrency } from "@/lib/format";
import { useUIStore } from "@/store/ui-store";

export function DashboardOverview() {
	const locale = useUIStore((state) => state.locale);
	const currency = useUIStore((state) => state.currency);
	const [rangeParams, setRangeParams] = useState<
		| { preset?: string; from?: string; to?: string }
		| undefined
	>(undefined);
	const dashboardQuery = useDashboardQuery(rangeParams);

	const data = dashboardQuery.data;

	if (!data) {
		return <Card>Loading dashboard...</Card>;
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-end">
				<TimeRangeSelector
					onChange={(preset, from, to) => {
						setRangeParams(
							preset === "custom" && from && to
								? { preset, from, to }
								: { preset },
						);
					}}
				/>
			</div>
			<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
				<Card>
					<CardTitle>Total this month</CardTitle>
					<p className="mt-2 text-lg font-semibold">
						{formatCurrency(
							data.totalMonthlySpend,
							currency,
							locale,
						)}
					</p>
				</Card>
				<Card>
					<CardTitle>Weekly spend</CardTitle>
					<p className="mt-2 text-lg font-semibold">
						{formatCurrency(data.weeklySpend, currency, locale)}
					</p>
				</Card>
				<Card>
					<CardTitle>Daily average</CardTitle>
					<p className="mt-2 text-lg font-semibold">
						{formatCurrency(data.dailyAverage, currency, locale)}
					</p>
				</Card>
				<Card>
					<CardTitle>Top category</CardTitle>
					<p className="mt-2 text-lg font-semibold">
						{data.topCategory || "N/A"}
					</p>
				</Card>
			</div>

			<ExportableChart title="Category Breakdown">
				<CategoryPieChart data={data.categoryBreakdown} />
			</ExportableChart>
			<ExportableChart title="Monthly Trend">
				<MonthlyLineChart data={data.monthlyTrend} />
			</ExportableChart>
			<ExportableChart title="Weekly Spend">
				<WeeklyBarChart data={data.weeklyTrend} />
			</ExportableChart>
		</div>
	);
}
