"use client";

import { useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { ChartCard } from "@/components/charts/chart-card";
import { useDashboardQuery } from "@/hooks/api/use-analytics-api";
import { toRangeParams } from "@/lib/date-range";
import type { GlobalDateRange } from "@/lib/date-range";
import { DEFAULT_GLOBAL_RANGE } from "@/lib/date-range";

export function DashboardBarChart() {
	const [range, setRange] = useState<GlobalDateRange>(DEFAULT_GLOBAL_RANGE);
	const rangeParams = toRangeParams(range);
	const { data, isLoading } = useDashboardQuery(rangeParams);

	const chartData = data?.mainSeries ?? [];
	const label = data?.chartLabel ?? "Spending Trend";

	return (
		<ChartCard
			title={label}
			defaultRange={range}
			onRangeChange={(newRange) => setRange(newRange)}
		>
			<div className="h-64">
				{isLoading ? (
					<div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
						Loading...
					</div>
				) : (
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={chartData}>
							<CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
							<XAxis
								dataKey="name"
								tick={{ fill: "var(--color-muted)", fontSize: 11 }}
								interval="preserveStartEnd"
							/>
							<YAxis tick={{ fill: "var(--color-muted)", fontSize: 11 }} />
							<Tooltip
								contentStyle={{
									backgroundColor: "var(--color-surface)",
									border: "1px solid var(--color-border)",
									borderRadius: "0.5rem",
									fontSize: "0.875rem",
								}}
							/>
							<Bar
								dataKey="total"
								fill="var(--chart-1)"
								radius={[4, 4, 0, 0]}
							/>
						</BarChart>
					</ResponsiveContainer>
				)}
			</div>
		</ChartCard>
	);
}
