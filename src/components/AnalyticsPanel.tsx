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
import { useDashboardQuery } from "@/hooks/api/use-analytics-api";
import { toRangeParams, DEFAULT_GLOBAL_RANGE } from "@/lib/date-range";
import type { GlobalDateRange } from "@/lib/date-range";

function MonthlyCategoryChart() {
	const [range, setRange] = useState<GlobalDateRange>(DEFAULT_GLOBAL_RANGE);
	const rangeParams = toRangeParams(range);
	const { data } = useDashboardQuery(rangeParams);

	const categoryKeys = useMemo(() => {
		if (!data) return [];
		const keys = new Set<string>();
		data.monthlyCategorySeries.forEach((row) => {
			Object.keys(row).forEach((key) => {
				if (key !== "month") keys.add(key);
			});
		});
		return Array.from(keys);
	}, [data]);

	const chartConfig = useMemo<ChartConfig>(
		() =>
			categoryKeys.reduce((acc, key, index) => {
				acc[key] = { label: key, color: `var(--chart-${(index % 5) + 1})` };
				return acc;
			}, {} as ChartConfig),
		[categoryKeys],
	);

	return (
		<ChartCard
			title="Monthly Spending by Category"
			defaultRange={range}
			onRangeChange={setRange}
			className="lg:col-span-2"
		>
			<ChartContainer config={chartConfig} className="min-h-[300px]">
				<ResponsiveContainer width="100%" height={300}>
					<BarChart data={data?.monthlyCategorySeries ?? []}>
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
	);
}

function DailyCashFlowChart() {
	const [range, setRange] = useState<GlobalDateRange>(DEFAULT_GLOBAL_RANGE);
	const rangeParams = toRangeParams(range);
	const { data } = useDashboardQuery(rangeParams);

	return (
		<ChartCard title="Daily Cash Flow Trend" defaultRange={range} onRangeChange={setRange}>
			<ChartContainer
				config={{ total: { label: "Total", color: "var(--chart-2)" } }}
				className="min-h-[250px]"
			>
				<ResponsiveContainer width="100%" height={250}>
					<LineChart data={data?.dailyCashFlowSeries ?? []}>
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
	);
}

function CategoryPieChart() {
	const [range, setRange] = useState<GlobalDateRange>(DEFAULT_GLOBAL_RANGE);
	const [activeIndex, setActiveIndex] = useState(0);
	const rangeParams = toRangeParams(range);
	const { data } = useDashboardQuery(rangeParams);

	const rankedCategories = useMemo(() => data?.rankedCategories ?? [], [data?.rankedCategories]);
	const chartConfig = useMemo<ChartConfig>(
		() =>
			rankedCategories.reduce((acc, entry, index) => {
				acc[entry.name] = { label: entry.name, color: `var(--chart-${(index % 5) + 1})` };
				return acc;
			}, {} as ChartConfig),
		[rankedCategories],
	);

	return (
		<ChartCard title="Expenses by Category" defaultRange={range} onRangeChange={setRange}>
			<ChartContainer config={chartConfig} className="min-h-[250px]">
				<ResponsiveContainer width="100%" height={250}>
					<PieChart>
						<Pie
							data={rankedCategories}
							dataKey="value"
							nameKey="name"
							cx="50%"
							cy="50%"
							innerRadius={65}
							outerRadius={95}
							onMouseEnter={(_, index) => setActiveIndex(index)}
						>
							{rankedCategories.map((entry, index) => (
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
	);
}

export function AnalyticsPanel() {
	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<MonthlyCategoryChart />
			<DailyCashFlowChart />
			<CategoryPieChart />
		</div>
	);
}
