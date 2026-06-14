"use client";

import { useMemo, useState } from "react";
import {
	Cell,
	LabelList,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
} from "recharts";

import { useCategoriesQuery } from "@/hooks/api/use-expenses-api";
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
	const categoriesQuery = useCategoriesQuery();

	const rankedCategories = useMemo(
		() => data?.rankedCategories ?? [],
		[data?.rankedCategories],
	);

	const colorMap = useMemo(
		() =>
			new Map(
				(categoriesQuery.data ?? []).map((c) => [c.name, c.color]),
			),
		[categoriesQuery.data],
	);

	return (
		<ChartCard
			title="Expenses by Category"
			defaultRange={range}
			onRangeChange={setRange}
		>
			<ResponsiveContainer width="100%" height={300}>
				<PieChart>
					<Pie
						data={rankedCategories}
						dataKey="value"
						nameKey="name"
						cx="50%"
						cy="50%"
						innerRadius={65}
						outerRadius={95}
						onMouseEnter={(_, index) =>
							setActiveIndex(index)
						}
					>
						{rankedCategories.map((entry, index) => (
							<Cell
								key={entry.name}
								fill={
									colorMap.get(entry.name) ??
									`var(--chart-${(index % 5) + 1})`
								}
								stroke="var(--color-surface)"
								strokeWidth={
									index === activeIndex ? 4 : 1
								}
								fillOpacity={
									index === activeIndex ? 1 : 0.8
								}
							/>
						))}
						<LabelList
							dataKey="name"
							position="outside"
							fontSize={11}
						/>
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
		</ChartCard>
	);
}
