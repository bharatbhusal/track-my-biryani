"use client";

import { useMemo, useState } from "react";

import { CustomDateTimeRangeModal } from "@/components/charts/custom-date-time-range-modal";
import { CategoryRankingBarChart } from "@/components/charts/category-ranking-bar-chart";
import { ExportableChart } from "@/components/charts/exportable-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { useDashboardQuery } from "@/hooks/api/use-analytics-api";
import {
	hasValidCustomRange,
	rangeLabel,
	toRangeParams,
} from "@/lib/date-range";
import { formatCurrency } from "@/lib/format";
import { useUIStore } from "@/store/ui-store";

export function DashboardOverview() {
	const locale = useUIStore((state) => state.locale);
	const currency = useUIStore((state) => state.currency);
	const globalDateRange = useUIStore(
		(state) => state.globalDateRange,
	);
	const setGlobalDateRange = useUIStore(
		(state) => state.setGlobalDateRange,
	);
	const customRangeModalOpen = useUIStore(
		(state) => state.customRangeModalOpen,
	);
	const setCustomRangeModalOpen = useUIStore(
		(state) => state.setCustomRangeModalOpen,
	);
	const [localDateRange, setLocalDateRange] = useState<{
		from: string;
		to: string;
	} | null>(null);
	const activeDateRange = useMemo(
		() =>
			localDateRange
				? {
						preset: "custom" as const,
						from: localDateRange.from,
						to: localDateRange.to,
					}
				: globalDateRange,
		[globalDateRange, localDateRange],
	);
	const rangeParams = useMemo(
		() => toRangeParams(activeDateRange),
		[activeDateRange],
	);
	const dashboardQuery = useDashboardQuery(rangeParams);

	const data = dashboardQuery.data;

	if (!data) {
		return <Card>Loading dashboard...</Card>;
	}

	return (
		<div className="space-y-4">
			<div
				className="flex items-center justify-between"
				data-animate="true"
			>
				<CardTitle>
					{localDateRange
						? "Custom (Dashboard)"
						: rangeLabel(globalDateRange)}
				</CardTitle>
				<Button
					variant="outline"
					onClick={() => setCustomRangeModalOpen(true)}
				>
					{globalDateRange.preset === "custom" &&
					hasValidCustomRange(globalDateRange)
						? "Edit Custom Range"
						: "Set Custom Range"}
				</Button>
			</div>

			<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
				<Card data-animate="true">
					<CardTitle>Total Spend</CardTitle>
					<p className="mt-2 text-2xl font-bold">
						{formatCurrency(data.totalSpend, currency, locale)}
					</p>
				</Card>
				<Card data-animate="true">
					<CardTitle>{data.averageLabel}</CardTitle>
					<p className="mt-2 text-2xl font-bold">
						{formatCurrency(data.averageSpend, currency, locale)}
					</p>
				</Card>
				<Card data-animate="true">
					<CardTitle>Top Category</CardTitle>
					<p className="mt-2 text-2xl font-bold">
						{data.topCategory}
					</p>
				</Card>
			</div>

			<div data-animate="true">
				<ExportableChart title={data.chartLabel}>
					<BarChart
						data={data.mainSeries}
						heightClass="h-64"
					/>
				</ExportableChart>
			</div>

			<div data-animate="true">
				<ExportableChart title="Category Ranking">
					<CategoryRankingBarChart
						data={data.rankedCategories}
						heightClass="h-72"
					/>
				</ExportableChart>
			</div>

			<CustomDateTimeRangeModal
				key={`${customRangeModalOpen}-${localDateRange?.from ?? globalDateRange.from ?? ""}-${localDateRange?.to ?? globalDateRange.to ?? ""}`}
				open={customRangeModalOpen}
				initialFrom={localDateRange?.from ?? globalDateRange.from ?? ""}
				initialTo={localDateRange?.to ?? globalDateRange.to ?? ""}
				hasLocalOverride={Boolean(localDateRange)}
				onClose={() => setCustomRangeModalOpen(false)}
				onApplyGlobal={(from, to) => {
					setLocalDateRange(null);
					setGlobalDateRange({ preset: "custom", from, to });
					setCustomRangeModalOpen(false);
				}}
				onApplyLocal={(from, to) => {
					setLocalDateRange({ from, to });
					setCustomRangeModalOpen(false);
				}}
				onClearLocal={() => setLocalDateRange(null)}
			/>
		</div>
	);
}
