"use client";

import { useState } from "react";
import {
	Line,
	LineChart as RechartsLineChart,
	ResponsiveContainer,
	Tooltip,
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
	const [showTooltip, setShowTooltip] = useState(false);

	return (
		<div className={`${heightClass} w-full`}>
			<ResponsiveContainer width="100%" height="100%">
				<RechartsLineChart
					data={data}
					onClick={() => setShowTooltip(true)}
					onMouseLeave={() => setShowTooltip(false)}
				>
					<XAxis
						dataKey="name"
						tick={{ fill: "var(--color-muted)", fontSize: 12 }}
					/>
					<YAxis
						tick={{ fill: "var(--color-muted)", fontSize: 12 }}
					/>
					<Tooltip
						active={showTooltip}
						contentStyle={{
							backgroundColor: "var(--color-surface)",
							border: "1px solid var(--color-border)",
							borderRadius: "0.5rem",
							fontSize: "0.875rem",
						}}
					/>
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
