"use client";

import { useMemo } from "react";
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
import { useDashboardQuery } from "@/hooks/api/use-analytics-api";
import { useCategoriesQuery } from "@/hooks/api/use-expenses-api";
import { toRangeParams } from "@/lib/date-range";
import type { GlobalDateRange } from "@/lib/date-range";

type Props = {
	range: GlobalDateRange;
	selectedCategoryId?: string;
};

const CHART_COLORS = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
];

export function DashboardBarChart({
	range,
	selectedCategoryId,
}: Props) {
	const rangeParams = toRangeParams(range);
	const { data, isLoading } = useDashboardQuery({
		...rangeParams,
		categoryId: selectedCategoryId,
	});
	const categoriesQuery = useCategoriesQuery();

	const stackedData = data?.stackedSeries ?? [];
	const categoryColorMap = useMemo(() => {
		const map = new Map<string, string>();
		const cats = categoriesQuery.data ?? [];
		cats.forEach((c, i) => {
			map.set(
				c.name,
				c.color ?? CHART_COLORS[i % CHART_COLORS.length],
			);
		});
		return map;
	}, [categoriesQuery.data]);

	const categoryNames = useMemo(() => {
		const names = new Set<string>();
		stackedData.forEach((item) => {
			Object.keys(item).forEach((key) => {
				if (key !== "name") names.add(key);
			});
		});
		return Array.from(names);
	}, [stackedData]);

	const average = data?.averageSpend ?? 0;
	const label = data?.chartLabel ?? "Spending Trend";

	if (stackedData.length < 1) return null;

	return (
		<ChartCard title={label}>
			<div className="h-64">
				{isLoading ? (
					<div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
						Loading...
					</div>
				) : (
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={stackedData}>
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
							{average > 0 && (
								<ReferenceLine
									y={average}
									stroke="var(--chart-2)"
									strokeDasharray="6 4"
									strokeWidth={2}
									label={{
										value: `Avg: ${average.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
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
