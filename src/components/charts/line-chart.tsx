"use client";

import {
	Line,
	LineChart as RechartsLineChart,
	ResponsiveContainer,
	XAxis,
	YAxis,
} from "recharts";

export function LineChart({
	data,
	heightClass = "h-52",
}: {
	data: Array<{ name: string; total: number }>;
	heightClass?: string;
}) {
	return (
		<div className={`${heightClass} w-full`}>
			<ResponsiveContainer width="100%" height="100%">
				<RechartsLineChart data={data}>
					<XAxis dataKey="name" />
					<YAxis />
					<Line
						dataKey="total"
						stroke="#4f46e5"
						strokeWidth={2}
					/>
				</RechartsLineChart>
			</ResponsiveContainer>
		</div>
	);
}
