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
	height = 208,
}: {
	data: Array<{ name: string; total: number }>;
	height?: number;
}) {
	const [showTooltip, setShowTooltip] = useState(false);

	return (
		<div className="w-full" style={{ height }}>
			<ResponsiveContainer width="100%" height={height}>
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
