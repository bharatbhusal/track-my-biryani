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

import { Card, CardTitle } from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
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
		<div className="grid grid-cols-1 gap-4">
			<Card>
				<CardTitle className="mb-2">Monthly Spending by Category</CardTitle>
				<ChartContainer config={chartConfig} className="min-h-[300px]">
					<ResponsiveContainer width="100%" height={300}>
						<BarChart data={data.monthlyCategorySeries}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="month" />
							<YAxis />
							<Tooltip />
							{categoryKeys.map((key, index) => (
								<Bar
									key={key}
									dataKey={key}
									stackId="spend"
									fill={`var(--chart-${(index % 5) + 1})`}
									radius={index === categoryKeys.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
								/>
							))}
						</BarChart>
					</ResponsiveContainer>
				</ChartContainer>
			</Card>

			<Card>
				<CardTitle className="mb-2">Daily Cash Flow Trend</CardTitle>
				<ChartContainer
					config={{ total: { label: "Total", color: "var(--chart-2)" } }}
					className="min-h-[300px]"
				>
					<ResponsiveContainer width="100%" height={300}>
						<LineChart data={data.dailyCashFlowSeries}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="name" />
							<YAxis />
							<Tooltip />
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
			</Card>

			<Card>
				<CardTitle className="mb-2">Expenses by Category</CardTitle>
				<ChartContainer config={chartConfig} className="min-h-[300px]">
					<ResponsiveContainer width="100%" height={300}>
						<PieChart>
							<Pie
								data={data.rankedCategories}
								dataKey="value"
								nameKey="name"
								cx="50%"
								cy="50%"
								innerRadius={65}
								outerRadius={95}
								activeIndex={activeIndex}
								activeShape={{
									outerRadius: 105,
								}}
								onMouseEnter={(_, index) => setActiveIndex(index)}
							>
								{data.rankedCategories.map((entry, index) => (
									<Cell
										key={entry.name}
										fill={`var(--chart-${(index % 5) + 1})`}
									/>
								))}
							</Pie>
							<Tooltip />
						</PieChart>
					</ResponsiveContainer>
				</ChartContainer>
			</Card>
		</div>
	);
}
