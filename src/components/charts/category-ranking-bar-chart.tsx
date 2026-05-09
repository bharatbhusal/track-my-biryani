"use client";

import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

export function CategoryRankingBarChart({
	data,
	heightClass = "h-64",
}: {
	data: Array<{ name: string; value: number }>;
	heightClass?: string;
}) {
	return (
		<div className={`${heightClass} w-full`}>
			<ResponsiveContainer width="100%" height="100%">
				<BarChart
					data={data}
					layout="vertical"
					margin={{ left: 24 }}
				>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis type="number" />
					<YAxis dataKey="name" type="category" width={90} />
					<Tooltip />
					<Bar
						dataKey="value"
						fill="#16a34a"
						radius={[0, 8, 8, 0]}
					/>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
