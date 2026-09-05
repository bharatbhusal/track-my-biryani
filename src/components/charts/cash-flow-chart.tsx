"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
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
  lineDash,
  type ColorMap,
  type StackedRow,
} from "@/components/charts/chart-helpers";

type Props = {
  stackedSeries: StackedRow[];
  categoryColorMap: ColorMap;
  isLoading: boolean;
};

export function CashFlowChart({
  stackedSeries,
  categoryColorMap,
  isLoading,
  title = "Cash Flow Trend",
}: Props & { title?: string }) {
  const categoryNames = useMemo(() => getCategoryNames(stackedSeries), [stackedSeries]);

  const paddedSeries = useMemo(() => {
    if (categoryNames.length === 0) return stackedSeries;
    return stackedSeries.map((item) => {
      const copy = { ...item };
      for (const name of categoryNames) {
        if (!(name in copy)) copy[name] = 0;
      }
      return copy;
    });
  }, [stackedSeries, categoryNames]);

  const totals = useMemo(() => {
    const sums = new Map<string, number>();
    for (const row of paddedSeries) {
      for (const name of categoryNames) {
        sums.set(name, (sums.get(name) ?? 0) + (Number(row[name]) || 0));
      }
    }
    return sums;
  }, [paddedSeries, categoryNames]);

  return (
    <ChartCard title={title}>
      {isLoading ? (
        <ChartSkeleton />
      ) : paddedSeries.length < 1 ? (
        <div className="flex h-64 items-center justify-center text-sm text-[var(--color-muted)] sm:h-[280px]">
          No trend data yet
        </div>
      ) : (
        <>
          <div
            role="img"
            aria-label={`${title}: ${categoryNames.join(", ")}`}
            tabIndex={0}
            className="h-64 w-full sm:h-[280px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={paddedSeries}>
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
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={chartColor(categoryColorMap, name, "var(--chart-2)")}
                    strokeDasharray={lineDash(i)}
                    strokeWidth={2.5}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer text-[var(--color-muted)]">Data table</summary>
            <table className="mt-1 w-full text-left">
              <tbody>
                {categoryNames.map((name) => (
                  <tr key={name}>
                    <th scope="row" className="py-0.5 pr-2 font-normal">
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
