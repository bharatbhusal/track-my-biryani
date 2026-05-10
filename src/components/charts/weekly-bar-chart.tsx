"use client";

import {
	Bar,
	BarChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { themedTooltipProps } from "@/components/charts/chart-tooltip";

export function WeeklyBarChart({
	data,
	heightClass = "h-52",
}: {
	data: Array<{ name: string; total: number }>;
	heightClass?: string;
}) {
	return (
		<div className={`${heightClass} w-full`}>
			<ResponsiveContainer width="100%" height="100%">
				<BarChart data={data}>
					<XAxis dataKey="name" />
					<YAxis />
					<Tooltip {...themedTooltipProps} />
					<Bar
						dataKey="total"
						fill="#0ea5e9"
						radius={[8, 8, 0, 0]}
					/>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
