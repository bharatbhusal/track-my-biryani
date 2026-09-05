"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartCard } from "@/components/charts/chart-card";
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import { ChartSkeleton } from "@/components/charts/chart-skeleton";
import {
  CHART_CURSOR,
  CHART_GRID,
  CHART_TICK,
  chartColor,
  getCategoryNames,
  type StackedRow,
} from "@/components/charts/chart-helpers";

type Props = {
  stackedSeries: StackedRow[];
  chartLabel?: string;
  averageSpend?: number;
  categoryColorMap: Record<string, string>;
  isLoading: boolean;
};

export function SpendingBarChart({
  stackedSeries,
  chartLabel,
  averageSpend,
  categoryColorMap,
  isLoading,
}: Props) {
  const categoryNames = useMemo(() => getCategoryNames(stackedSeries), [stackedSeries]);

  const totals = useMemo(() => {
    const sums = new Map<string, number>();
    for (const row of stackedSeries) {
      for (const name of categoryNames) {
        sums.set(name, (sums.get(name) ?? 0) + (Number(row[name]) || 0));
      }
    }
    return sums;
  }, [stackedSeries, categoryNames]);

  const label = chartLabel ?? "Spending Trend";

  return (
    <ChartCard title={label}>
      {isLoading ? (
        <ChartSkeleton />
      ) : categoryNames.length < 1 ? (
        <div className="flex h-64 items-center justify-center text-sm text-[var(--color-muted)] sm:h-[280px]">
          No spending data yet
        </div>
      ) : (
        <>
          <div
            role="img"
            aria-label={`${label}: ${categoryNames.join(", ")}`}
            tabIndex={0}
            className="h-64 w-full sm:h-[280px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackedSeries}>
                <CartesianGrid {...CHART_GRID} />
                <XAxis
                  dataKey="name"
                  tick={CHART_TICK}
                  interval="preserveStartEnd"
                  minTickGap={8}
                />
                <YAxis tick={CHART_TICK} width={48} />
                <Tooltip content={<ChartTooltip />} cursor={CHART_CURSOR} />
                {categoryNames.map((name, i) => (
                  <Bar
                    key={name}
                    dataKey={name}
                    stackId="spend"
                    fill={chartColor(categoryColorMap, name, "var(--chart-1)")}
                    // ponytail: top-only radius on the last stack segment.
                    radius={i === categoryNames.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
                {(averageSpend ?? 0) > 0 && (
                  <ReferenceLine
                    y={averageSpend}
                    stroke="var(--chart-2)"
                    strokeDasharray="6 4"
                    strokeWidth={2}
                    label={{
                      value: `Avg: ${(averageSpend ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
                      position: "left",
                      fill: "var(--chart-2)",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer text-[var(--color-muted)]">Spending summary</summary>
            <table className="mt-1 w-full text-left">
              <tbody>
                {categoryNames.map((name) => (
                  <tr key={name}>
                    <th scope="row" className="py-0.5 pr-2 font-normal">
                      <span
                        aria-hidden="true"
                        className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: chartColor(categoryColorMap, name, "var(--chart-1)"),
                        }}
                      />
                      {name}
                    </th>
                    <td className="py-0.5 text-right tabular-nums">
                      {(totals.get(name) ?? 0).toLocaleString("en-US", {
                        maximumFractionDigits: 0,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </ChartCard>
  );
}

// ponytail: transition alias until all callers move to SpendingBarChart.
export const DashboardBarChart = SpendingBarChart;
