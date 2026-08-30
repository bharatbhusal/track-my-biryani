"use client";

import { useMemo, useState } from "react";
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
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import { ChartSkeleton } from "@/components/charts/chart-skeleton";

type Props = {
  stackedSeries: Array<Record<string, string | number>>;
  categoryColorMap: Map<string, string>;
  isLoading: boolean;
};

export function CashFlowChart({
  stackedSeries,
  categoryColorMap,
  isLoading,
  title = "Cash Flow Trend",
}: Props & { title?: string }) {
  const categoryNames = useMemo(() => {
    const names = new Set<string>();
    stackedSeries.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (key !== "name") names.add(key);
      });
    });
    return Array.from(names);
  }, [stackedSeries]);

  const paddedSeries = useMemo(() => {
    if (categoryNames.length === 0) return stackedSeries;
    return stackedSeries.map((item) => {
      const copy = { ...item };
      for (const name of categoryNames) {
        if (!(name in copy)) {
          (copy as Record<string, string | number>)[name] = 0;
        }
      }
      return copy;
    });
  }, [stackedSeries, categoryNames]);

  const [showTooltip, setShowTooltip] = useState(false);

  if (paddedSeries.length < 1 && !isLoading) return null;

  return (
    <ChartCard title={title}>
      {isLoading ? (
        <ChartSkeleton />
      ) : (
        <ChartContainer
          config={Object.fromEntries(
            categoryNames.map((name) => [
              name,
              {
                label: name,
                color: categoryColorMap.get(name) ?? "var(--chart-2)",
              },
            ]),
          )}
          className="min-h-[250px]"
        >
          <ResponsiveContainer width="100%" height={250}>
            <LineChart
              data={paddedSeries}
              onClick={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="name"
                tick={{
                  fill: "var(--color-muted)",
                  fontSize: 12,
                }}
              />
              <YAxis
                tick={{
                  fill: "var(--color-muted)",
                  fontSize: 12,
                }}
              />
              <Tooltip active={showTooltip} content={<ChartTooltip />} />
              {categoryNames.map((name) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={categoryColorMap.get(name) ?? "var(--chart-2)"}
                  strokeWidth={2.5}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}
    </ChartCard>
  );
}
