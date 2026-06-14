"use client";

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
import { toRangeParams } from "@/lib/date-range";
import type { GlobalDateRange } from "@/lib/date-range";

type Props = {
	range: GlobalDateRange;
	selectedCategoryId?: string;
};

export function DailyCashFlowChart({ range, selectedCategoryId }: Props) {
	const rangeParams = toRangeParams(range);
	const { data } = useDashboardQuery({
		...rangeParams,
		categoryId: selectedCategoryId,
	});

	return (
		<ChartCard title="Daily Cash Flow Trend">
			<ChartContainer
				config={{
					total: { label: "Total", color: "var(--chart-2)" },
				}}
				className="min-h-[250px]"
			>
				<ResponsiveContainer width="100%" height={250}>
					<LineChart data={data?.dailyCashFlowSeries ?? []}>
						<CartesianGrid
							strokeDasharray="3 3"
							stroke="var(--color-border)"
						/>
						<XAxis
							dataKey="name"
							tick={{ fill: "var(--color-muted)", fontSize: 12 }}
						/>
						<YAxis
							tick={{ fill: "var(--color-muted)", fontSize: 12 }}
						/>
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
