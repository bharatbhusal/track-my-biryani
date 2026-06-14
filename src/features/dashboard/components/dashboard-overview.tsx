"use client";

import { useState } from "react";
import {
	FiDollarSign,
	FiTrendingUp,
	FiAward,
} from "react-icons/fi";

import { Card, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { DashboardBarChart } from "@/features/dashboard/components/dashboard-bar-chart";
import type { GlobalDateRange } from "@/lib/date-range";
import { DailyCashFlowChart } from "@/components/DailyCashFlowChart";

export function DashboardOverview() {
	const locale = useUIStore((state) => state.locale);
	const currency = useUIStore((state) => state.currency);
	const [mainRange, setMainRange] =
		useState<GlobalDateRange>(DEFAULT_GLOBAL_RANGE);
	const rangeParams = toRangeParams(mainRange);
	const { data, isLoading } = useDashboardQuery(rangeParams);

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
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 w-full">
					{[...Array(3)].map((_, i) => (
						<Card key={i}>
							<Skeleton className="h-4 w-24 mb-2" />
							<Skeleton className="h-8 w-32" />
						</Card>
					))}
				</div>
			) : (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 w-full">
					<Card>
						<div className="flex items-center gap-3">
							<div className="rounded-lg bg-[var(--color-surface-muted)] p-2">
								<FiDollarSign className="h-5 w-5 text-[var(--color-muted)]" />
							</div>
							<div>
								<CardTitle>Total Spend</CardTitle>
								<p className="mt-1 text-xl font-bold">
									{formatCurrency(data.totalSpend, currency, locale)}
								</p>
							</div>
						</div>
					</Card>
					<Card>
						<div className="flex items-center gap-3">
							<div className="rounded-lg bg-[var(--color-surface-muted)] p-2">
								<FiTrendingUp className="h-5 w-5 text-[var(--color-muted)]" />
							</div>
							<div>
								<CardTitle>{data.averageLabel}</CardTitle>
								<p className="mt-1 text-xl font-bold">
									{formatCurrency(
										data.averageSpend,
										currency,
										locale,
									)}
								</p>
							</div>
						</div>
					</Card>
					<Card>
						<div className="flex items-center gap-3">
							<div className="rounded-lg bg-[var(--color-surface-muted)] p-2">
								<FiAward className="h-5 w-5 text-[var(--color-muted)]" />
							</div>
							<div>
								<CardTitle>Top Category</CardTitle>
								<p className="mt-1 text-xl font-bold">
									{data.topCategory}
								</p>
							</div>
						</div>
					</Card>
				</div>
			)}

			<DashboardBarChart />
			<DailyCashFlowChart />
			<CategoryPieChart />
			{/* <AnalyticsPanel /> */}
		</div>
	);
}
