"use client";

import { useMemo } from "react";
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { ChartContainer } from "@/components/ui/chart";
import { ChartCard } from "@/components/charts/chart-card";
import { useDashboardQuery } from "@/hooks/api/use-analytics-api";
import { useCategoriesQuery } from "@/hooks/api/use-expenses-api";
import { toRangeParams } from "@/lib/date-range";
import type { GlobalDateRange } from "@/lib/date-range";

type Props = {
	range: GlobalDateRange;
	selectedCategoryId?: string;
};

const LINE_COLORS = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
];

export function DailyCashFlowChart({
	range,
	selectedCategoryId,
}: Props) {
	const rangeParams = toRangeParams(range);
	const { data } = useDashboardQuery({
		...rangeParams,
		categoryId: selectedCategoryId,
	});
	const categoriesQuery = useCategoriesQuery();

	const series = data?.stackedSeries ?? [];

	const categoryColorMap = useMemo(() => {
		const map = new Map<string, string>();
		const cats = categoriesQuery.data ?? [];
		cats.forEach((c, i) => {
			map.set(
				c.name,
				c.color ?? LINE_COLORS[i % LINE_COLORS.length],
			);
		});
		return map;
	}, [categoriesQuery.data]);

	const categoryNames = useMemo(() => {
		const names = new Set<string>();
		series.forEach((item) => {
			Object.keys(item).forEach((key) => {
				if (key !== "name") names.add(key);
			});
		});
		return Array.from(names);
	}, [series]);

	if (series.length < 2) return null;

	return (
		<ChartCard title="Daily Cash Flow Trend">
			<ChartContainer
				config={Object.fromEntries(
					categoryNames.map((name) => [
						name,
						{
							label: name,
							color:
								categoryColorMap.get(name) ?? "var(--chart-2)",
						},
					]),
				)}
				className="min-h-[250px]"
			>
				<ResponsiveContainer width="100%" height={250}>
					<LineChart data={series}>
						<CartesianGrid
							strokeDasharray="3 3"
							stroke="var(--color-border)"
						/>
						<XAxis
							dataKey="name"
							tick={{
								fill: "var(--color-muted)",
								fontSize: 12,
							}}
						/>
						<YAxis
							tick={{
								fill: "var(--color-muted)",
								fontSize: 12,
							}}
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
							<Line
								key={name}
								type="monotone"
								dataKey={name}
								stroke={
									categoryColorMap.get(name) ?? "var(--chart-2)"
								}
								strokeWidth={2.5}
								dot={false}
							/>
						))}
					</LineChart>
				</ResponsiveContainer>
			</ChartContainer>
		</ChartCard>
	);
}
