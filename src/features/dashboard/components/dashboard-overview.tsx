"use client";

import { useMemo, useState } from "react";
import {
	FiCalendar,
	FiDollarSign,
	FiTrendingUp,
	FiAward,
} from "react-icons/fi";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/stat-card";
import { DateRangeSelect } from "@/components/charts/date-range-select";
import { useDashboardQuery } from "@/hooks/api/use-analytics-api";
import {
	rangeLabel,
	toRangeParams,
	DEFAULT_GLOBAL_RANGE,
} from "@/lib/date-range";
import { formatCurrency } from "@/lib/format";
import { useUIStore } from "@/store/ui-store";
import { CategoryPieChart } from "@/components/CategoryPieChart";
import { DashboardBarChart } from "@/components/dashboard-bar-chart";
import type { GlobalDateRange } from "@/lib/date-range";
import { DailyCashFlowChart } from "@/components/DailyCashFlowChart";

function daysElapsed(preset: string): number {
	const now = new Date();
	const start = new Date(now);
	if (preset === "this_week") {
		start.setDate(now.getDate() - 6);
	} else if (preset === "this_year") {
		start.setMonth(0, 1);
	} else {
		start.setDate(1);
	}
	start.setHours(0, 0, 0, 0);
	return Math.floor(
		(now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
	);
}

export function DashboardOverview() {
	const locale = useUIStore((state) => state.locale);
	const currency = useUIStore((state) => state.currency);
	const [mainRange, setMainRange] =
		useState<GlobalDateRange>(DEFAULT_GLOBAL_RANGE);
	const rangeParams = toRangeParams(mainRange);
	const { data, isLoading } = useDashboardQuery(rangeParams);

	const days = useMemo(
		() => daysElapsed(mainRange.preset),
		[mainRange.preset],
	);

	const topCategoryPct = useMemo(() => {
		if (!data?.rankedCategories?.length) return "";
		const pct =
			(data.rankedCategories[0].value / data.totalSpend) * 100;
		return ` (${pct.toFixed(1)}%)`;
	}, [data]);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between flex-wrap gap-2">
				<h2 className="text-lg font-semibold tracking-tight">
					{rangeLabel(mainRange)}
				</h2>
				<DateRangeSelect
					value={mainRange}
					onChange={setMainRange}
				/>
			</div>

			{isLoading || !data ? (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full">
					{[...Array(4)].map((_, i) => (
						<Card key={i}>
							<Skeleton className="h-4 w-24 mb-2" />
							<Skeleton className="h-8 w-32" />
						</Card>
					))}
				</div>
			) : (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full">
					<StatCard
						icon={
							<FiDollarSign className="h-5 w-5 text-[var(--color-muted)]" />
						}
						title="Total Spend"
						value={formatCurrency(
							data.totalSpend,
							currency,
							locale,
						)}
					/>
					<StatCard
						icon={
							<FiAward className="h-5 w-5 text-[var(--color-muted)]" />
						}
						title="Top Category"
						value={`${data.topCategory}${topCategoryPct}`}
					/>
					<StatCard
						icon={
							<FiCalendar className="h-5 w-5 text-[var(--color-muted)]" />
						}
						title="Spend per Day"
						value={formatCurrency(
							days > 0 ? data.totalSpend / days : data.totalSpend,
							currency,
							locale,
						)}
					/>
				</div>
			)}

			<DashboardBarChart />
			<DailyCashFlowChart />
			<CategoryPieChart />
		</div>
	);
}
