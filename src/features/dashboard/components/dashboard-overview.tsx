"use client";

import { useEffect, useMemo, useState } from "react";

import { CategoryRankingBarChart } from "@/components/charts/category-ranking-bar-chart";
import { ExportableChart } from "@/components/charts/exportable-chart";
import { WeeklyBarChart } from "@/components/charts/weekly-bar-chart";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
	const [from, setFrom] = useState(
		globalDateRange.from ?? "",
	);
	const [to, setTo] = useState(globalDateRange.to ?? "");
	const rangeParams = useMemo(
		() => toRangeParams(globalDateRange),
		[globalDateRange],
	);
	const dashboardQuery = useDashboardQuery(rangeParams);

	useEffect(() => {
		if (!customRangeModalOpen) {
			return;
		}

		if (!customRangeModalOpen) return;

		const t = setTimeout(() => {
			setFrom(globalDateRange.from ?? "");
			setTo(globalDateRange.to ?? "");
		}, 0);

		return () => clearTimeout(t);
	}, [
		customRangeModalOpen,
		globalDateRange.from,
		globalDateRange.to,
	]);

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
				<CardTitle>{rangeLabel(globalDateRange)}</CardTitle>
				{globalDateRange.preset === "custom" &&
					hasValidCustomRange(globalDateRange) && (
						<Button
							variant="outline"
							onClick={() => setCustomRangeModalOpen(true)}
						>
							Edit Custom Range
						</Button>
					)}
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
					<WeeklyBarChart
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

			<Modal
				open={customRangeModalOpen}
				title="Choose Custom Range"
				onClose={() => setCustomRangeModalOpen(false)}
			>
				<div className="space-y-3">
					<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
						<label className="text-sm">
							From
							<Input
								type="date"
								value={from}
								onChange={(event) => setFrom(event.target.value)}
							/>
						</label>
						<label className="text-sm">
							To
							<Input
								type="date"
								value={to}
								onChange={(event) => setTo(event.target.value)}
							/>
						</label>
					</div>
					<Button
						disabled={!from || !to}
						onClick={() => {
							setGlobalDateRange({
								preset: "custom",
								from,
								to,
							});
							setCustomRangeModalOpen(false);
						}}
						className="w-full"
					>
						Apply Range
					</Button>
				</div>
			</Modal>
		</div>
	);
}
