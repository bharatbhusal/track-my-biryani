"use client";

import { useMemo, useState } from "react";
import {
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
} from "recharts";

import {
	ChartContainer,
	type ChartConfig,
} from "@/components/ui/chart";
import { ChartCard } from "@/components/charts/chart-card";
import { useDashboardQuery } from "@/hooks/api/use-analytics-api";
import {
	toRangeParams,
	DEFAULT_GLOBAL_RANGE,
} from "@/lib/date-range";
import type { GlobalDateRange } from "@/lib/date-range";

export function CategoryPieChart() {
	const [range, setRange] = useState<GlobalDateRange>(
		DEFAULT_GLOBAL_RANGE,
	);
	const [activeIndex, setActiveIndex] = useState(0);
	const rangeParams = toRangeParams(range);
	const { data } = useDashboardQuery(rangeParams);

	const rankedCategories = useMemo(
		() => data?.rankedCategories ?? [],
		[data?.rankedCategories],
	);
	const chartConfig = useMemo<ChartConfig>(
		() =>
			rankedCategories.reduce((acc, entry, index) => {
				acc[entry.name] = {
					label: entry.name,
					color: `var(--chart-${(index % 5) + 1})`,
				};
				return acc;
			}, {} as ChartConfig),
		[rankedCategories],
	);

	return (
		<ChartCard
			title="Expenses by Category"
			defaultRange={range}
			onRangeChange={setRange}
		>
			<ChartContainer
				config={chartConfig}
				className="min-h-[250px]"
			>
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
