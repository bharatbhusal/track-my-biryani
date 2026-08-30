"use client";

import { useState } from "react";
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
  height = 208,
  unit = "",
}: {
  data: Array<{ name: string; total: number }>;
  height?: number;
  unit?: string;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          onClick={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <XAxis dataKey="name" tick={{ fill: "var(--color-muted)", fontSize: 12 }} />
          <YAxis
            tick={{ fill: "var(--color-muted)", fontSize: 12 }}
            tickFormatter={(value: number) => `${value}${unit}`}
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
          <Bar dataKey="total" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
