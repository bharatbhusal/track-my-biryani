"use client";

import { FiDollarSign, FiTrendingUp, FiAward } from "react-icons/fi";

import { AnalyticsPanel } from "@/components/AnalyticsPanel";
import { Card, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardQuery } from "@/hooks/api/use-analytics-api";
import {
	rangeLabel,
	toRangeParams,
	DEFAULT_GLOBAL_RANGE,
} from "@/lib/date-range";
import { formatCurrency } from "@/lib/format";
import { useUIStore } from "@/store/ui-store";

export function DashboardOverview() {
	const locale = useUIStore((state) => state.locale);
	const currency = useUIStore((state) => state.currency);
	const rangeParams = toRangeParams(DEFAULT_GLOBAL_RANGE);
	const dashboardQuery = useDashboardQuery(rangeParams);

	const data = dashboardQuery.data;

	if (!data) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-6 w-52" />
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
					{[...Array(3)].map((_, i) => (
						<Card key={i}>
							<Skeleton className="h-4 w-24 mb-2" />
							<Skeleton className="h-8 w-32" />
						</Card>
					))}
				</div>
				<Skeleton className="h-64 w-full" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	const statCards = [
		{
			title: "Total Spend",
			value: formatCurrency(data.totalSpend, currency, locale),
			icon: FiDollarSign,
		},
		{
			title: data.averageLabel,
			value: formatCurrency(data.averageSpend, currency, locale),
			icon: FiTrendingUp,
		},
		{
			title: "Top Category",
			value: data.topCategory,
			icon: FiAward,
		},
	];

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold tracking-tight">
					{rangeLabel(DEFAULT_GLOBAL_RANGE)}
				</h2>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 w-full">
				{statCards.map((stat) => {
					const Icon = stat.icon;
					return (
						<Card key={stat.title}>
							<div className="flex items-center gap-3">
								<div className="rounded-lg bg-[var(--color-surface-muted)] p-2">
									<Icon className="h-5 w-5 text-[var(--color-muted)]" />
								</div>
								<div>
									<CardTitle>{stat.title}</CardTitle>
									<p className="mt-1 text-xl font-bold">{stat.value}</p>
								</div>
							</div>
						</Card>
					);
				})}
			</div>

			<AnalyticsPanel data={data} />
		</div>
	);
}
