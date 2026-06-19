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

	if (stackedSeries.length < 1) return null;

	return (
		<ChartCard title={label}>
			<div className="h-64">
				{isLoading ? (
					<div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
						Loading...
					</div>
				) : (
					<ResponsiveContainer width="100%" height="100%">
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
								contentStyle={{
									backgroundColor: "var(--color-surface)",
									border: "1px solid var(--color-border)",
									borderRadius: "0.5rem",
									fontSize: "0.875rem",
								}}
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
