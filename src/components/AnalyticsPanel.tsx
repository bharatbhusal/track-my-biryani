"use client";

import { useMemo, useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { ChartCard } from "@/components/charts/chart-card";
import type { DashboardAnalytics } from "@/types/analytics.types";

type AnalyticsPanelProps = {
	data: DashboardAnalytics;
};

export function AnalyticsPanel({ data }: AnalyticsPanelProps) {
	const [activeIndex, setActiveIndex] = useState(0);
	const categoryKeys = useMemo(() => {
		const keys = new Set<string>();
		data.monthlyCategorySeries.forEach((row) => {
			Object.keys(row).forEach((key) => {
				if (key !== "month") keys.add(key);
			});
		});
		return Array.from(keys);
	}, [data.monthlyCategorySeries]);

	const chartConfig = useMemo<ChartConfig>(
		() =>
			categoryKeys.reduce((acc, key, index) => {
				acc[key] = {
					label: key,
					color: `var(--chart-${(index % 5) + 1})`,
				};
				return acc;
			}, {} as ChartConfig),
		[categoryKeys],
	);

	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<ChartCard title="Monthly Spending by Category" className="lg:col-span-2">
				<ChartContainer config={chartConfig} className="min-h-[300px]">
					<ResponsiveContainer width="100%" height={300}>
						<BarChart data={data.monthlyCategorySeries}>
							<CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
							<XAxis dataKey="month" tick={{ fill: "var(--color-muted)", fontSize: 12 }} />
							<YAxis tick={{ fill: "var(--color-muted)", fontSize: 12 }} />
							<Tooltip
								contentStyle={{
									backgroundColor: "var(--color-surface)",
									border: "1px solid var(--color-border)",
									borderRadius: "0.5rem",
									fontSize: "0.875rem",
								}}
							/>
							{categoryKeys.map((key, index) => (
								<Bar
									key={key}
									dataKey={key}
									stackId="spend"
									fill={`var(--chart-${(index % 5) + 1})`}
									radius={[4, 4, 0, 0]}
								/>
							))}
						</BarChart>
					</ResponsiveContainer>
				</ChartContainer>
			</ChartCard>

			<ChartCard title="Daily Cash Flow Trend">
				<ChartContainer
					config={{ total: { label: "Total", color: "var(--chart-2)" } }}
					className="min-h-[250px]"
				>
					<ResponsiveContainer width="100%" height={250}>
						<LineChart data={data.dailyCashFlowSeries}>
							<CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
							<XAxis dataKey="name" tick={{ fill: "var(--color-muted)", fontSize: 12 }} />
							<YAxis tick={{ fill: "var(--color-muted)", fontSize: 12 }} />
							<Tooltip
								contentStyle={{
									backgroundColor: "var(--color-surface)",
									border: "1px solid var(--color-border)",
									borderRadius: "0.5rem",
									fontSize: "0.875rem",
								}}
							/>
							<Line
								type="monotone"
								dataKey="total"
								stroke="var(--chart-2)"
								strokeWidth={2.5}
								dot={false}
							/>
						</LineChart>
					</ResponsiveContainer>
				</ChartContainer>
			</ChartCard>

			<ChartCard title="Expenses by Category">
				<ChartContainer config={chartConfig} className="min-h-[250px]">
					<ResponsiveContainer width="100%" height={250}>
						<PieChart>
							<Pie
								data={data.rankedCategories}
								dataKey="value"
								nameKey="name"
								cx="50%"
								cy="50%"
								innerRadius={65}
								outerRadius={95}
								onMouseEnter={(_, index) => setActiveIndex(index)}
							>
								{data.rankedCategories.map((entry, index) => (
									<Cell
										key={entry.name}
										fill={`var(--chart-${(index % 5) + 1})`}
										stroke="var(--color-surface)"
										strokeWidth={index === activeIndex ? 4 : 1}
										fillOpacity={index === activeIndex ? 1 : 0.8}
									/>
								))}
							</Pie>
							<Tooltip
								contentStyle={{
									backgroundColor: "var(--color-surface)",
									border: "1px solid var(--color-border)",
									borderRadius: "0.5rem",
									fontSize: "0.875rem",
								}}
							/>
						</PieChart>
					</ResponsiveContainer>
				</ChartContainer>
			</ChartCard>
		</div>
	);
}
