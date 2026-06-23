"use client";

import { useMemo, useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { ChartCard } from "@/components/charts/chart-card";
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
	stackedSeries: Array<Record<string, string | number>>;
	chartLabel?: string;
	averageSpend?: number;
	categoryColorMap: Map<string, string>;
	isLoading: boolean;
};

export function DashboardBarChart({
	stackedSeries,
	chartLabel,
	averageSpend,
	categoryColorMap,
	isLoading,
}: Props) {
	const categoryNames = useMemo(() => {
		const names = new Set<string>();
		stackedSeries.forEach((item) => {
			Object.keys(item).forEach((key) => {
				if (key !== "name") names.add(key);
			});
		});
		return Array.from(names);
	}, [stackedSeries]);

	const [showTooltip, setShowTooltip] = useState(false);

	const label = chartLabel ?? "Spending Trend";

	return (
		<ChartCard title={label}>
			<div className="h-64">
				{isLoading ? (
					<div className="flex h-full items-end justify-around">
						{[60, 80, 45, 90, 55, 70, 85].map((h, i) => (
							<div
								key={i}
								className="w-4"
								style={{ height: `${h}%` }}
							>
								<Skeleton className="h-full w-full rounded-sm" />
							</div>
						))}
					</div>
				) : categoryNames.length < 1 ? (
					<div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
						No Data
					</div>
				) : (
					<ResponsiveContainer>
						<BarChart
							data={stackedSeries}
							onClick={() => setShowTooltip(true)}
							onMouseLeave={() => setShowTooltip(false)}
						>
							<CartesianGrid
								strokeDasharray="3 3"
								stroke="var(--color-border)"
							/>
							<XAxis
								dataKey="name"
								tick={{ fill: "var(--color-muted)", fontSize: 11 }}
								interval="preserveStartEnd"
							/>
							<YAxis
								tick={{ fill: "var(--color-muted)", fontSize: 11 }}
							/>
							<Tooltip
								active={showTooltip}
								content={<ChartTooltip />}
							/>
							{categoryNames.map((name) => (
								<Bar
									key={name}
									dataKey={name}
									stackId="spend"
									fill={
										categoryColorMap.get(name) ?? "var(--chart-1)"
									}
									radius={[2, 2, 2, 2]}
									activeBar={{
										stroke: "var(--color-text)",
										strokeWidth: 2,
									}}
								/>
							))}
							{(averageSpend ?? 0) > 0 && (
								<ReferenceLine
									y={averageSpend}
									stroke="var(--chart-2)"
									strokeDasharray="6 4"
									strokeWidth={2}
									label={{
										value: `Avg: ${(averageSpend ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
										position: "left",
										fill: "var(--chart-2)",
										fontSize: 11,
										fontWeight: 600,
									}}
								/>
							)}
						</BarChart>
					</ResponsiveContainer>
				)}
			</div>
		</ChartCard>
	);
}
