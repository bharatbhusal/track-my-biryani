"use client";

import { useMemo } from "react";
import {
	FiCalendar,
	FiDollarSign,
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
} from "@/lib/date-range";
import { formatCurrency } from "@/lib/format";
import { useUIStore } from "@/store/ui-store";
import type { GlobalDateRange } from "@/lib/date-range";

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

type ExpenseOverviewProps = {
	range: GlobalDateRange;
	onRangeChange: (range: GlobalDateRange) => void;
};

export function ExpenseOverview({
	range,
	onRangeChange,
}: ExpenseOverviewProps) {
	const locale = useUIStore((state) => state.locale);
	const currency = useUIStore((state) => state.currency);
	const rangeParams = toRangeParams(range);
	const { data, isLoading } = useDashboardQuery(rangeParams);

	const days = useMemo(
		() => daysElapsed(range.preset),
		[range.preset],
	);

	const topCategoryPct = useMemo(() => {
		if (!data?.rankedCategories?.length) return "";
		const pct =
			(data.rankedCategories[0].value / data.totalSpend) * 100;
		return ` (${pct.toFixed(1)}%)`;
	}, [data]);

	return (
		<div>
			<div className="flex items-center justify-between flex-wrap gap-2 mb-3">
				<h3 className="text-base font-semibold tracking-tight">
					{rangeLabel(range)}
				</h3>
				<DateRangeSelect
					value={range}
					onChange={(r) => {
						onRangeChange(r);
					}}
				/>
			</div>

			{isLoading || !data ? (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3 w-full">
					{[...Array(3)].map((_, i) => (
						<Card key={i}>
							<Skeleton className="h-4 w-24 mb-2" />
							<Skeleton className="h-8 w-32" />
						</Card>
					))}
				</div>
			) : (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3 w-full">
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
		</div>
	);
}
