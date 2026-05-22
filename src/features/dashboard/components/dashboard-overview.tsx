"use client";

import { useMemo, useState } from "react";

import { AnalyticsPanel } from "@/components/AnalyticsPanel";
import { CustomDateTimeRangeModal } from "@/components/charts/custom-date-time-range-modal";
import { Button } from "@/components/ui/button";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
		return (
			<Card>
				<div className="space-y-3">
					<Skeleton className="h-6 w-52" />
					<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
						<Skeleton className="h-24 w-full" />
						<Skeleton className="h-24 w-full" />
						<Skeleton className="h-24 w-full" />
					</div>
					<Skeleton className="h-64 w-full" />
					<Skeleton className="h-64 w-full" />
				</div>
			</Card>
		);
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

			<div data-animate="true">
				<Carousel className="w-full">
					<CarouselContent>
						<CarouselItem>
							<Card>
								<CardTitle>Daily Cash Flow</CardTitle>
								<p className="mt-2 text-2xl font-bold">
									{formatCurrency(data.totalSpend, currency, locale)}
								</p>
							</Card>
						</CarouselItem>
						<CarouselItem>
							<Card>
								<CardTitle>Weekly Spending</CardTitle>
								<p className="mt-2 text-2xl font-bold">
									{formatCurrency(data.averageSpend, currency, locale)}
								</p>
							</Card>
						</CarouselItem>
						<CarouselItem>
							<Card>
								<CardTitle>Category breakdown</CardTitle>
								<p className="mt-2 text-2xl font-bold">{data.topCategory}</p>
							</Card>
						</CarouselItem>
					</CarouselContent>
					<CarouselPrevious />
					<CarouselNext />
				</Carousel>
			</div>

			<AnalyticsPanel data={data} />

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
