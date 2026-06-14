"use client";

import {
	Bar,
	BarChart as RechartsBarChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

export function BarChart({
	data,
	heightClass = "h-52",
	unit = "",
}: {
	data: Array<{ name: string; total: number }>;
	heightClass?: string;
	unit?: string;
}) {
	return (
		<div className={`${heightClass} w-full`}>
			<ResponsiveContainer width="100%" height="100%">
				<RechartsBarChart data={data}>
					<XAxis
						dataKey="name"
						tick={{ fill: "var(--color-muted)", fontSize: 12 }}
					/>
					<YAxis
						tick={{ fill: "var(--color-muted)", fontSize: 12 }}
						tickFormatter={(value: number) => `${value}${unit}`}
					/>
					<Tooltip
						contentStyle={{
							backgroundColor: "var(--color-surface)",
							border: "1px solid var(--color-border)",
							borderRadius: "0.5rem",
							fontSize: "0.875rem",
						}}
					/>
					<Bar
						dataKey="total"
						fill="var(--chart-1)"
						radius={[8, 8, 0, 0]}
					/>
				</RechartsBarChart>
			</ResponsiveContainer>
		</div>
	);
}
