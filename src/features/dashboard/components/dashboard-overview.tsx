"use client";

import { AnalyticsPanel } from "@/components/AnalyticsPanel";
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
			<div className="flex items-center justify-between" data-animate="true">
				<CardTitle>{rangeLabel(DEFAULT_GLOBAL_RANGE)}</CardTitle>
			</div>

			<div data-animate="true">
				<Carousel className="w-full">
					<CarouselContent>
						<CarouselItem>
							<Card>
								<CardTitle>Total Spend</CardTitle>
								<p className="mt-2 text-2xl font-bold">
									{formatCurrency(data.totalSpend, currency, locale)}
								</p>
							</Card>
						</CarouselItem>
						<CarouselItem>
							<Card>
								<CardTitle>{data.averageLabel}</CardTitle>
								<p className="mt-2 text-2xl font-bold">
									{formatCurrency(
										data.averageSpend,
										currency,
										locale,
									)}
								</p>
							</Card>
						</CarouselItem>
						<CarouselItem>
							<Card>
								<CardTitle>Top Category</CardTitle>
								<p className="mt-2 text-2xl font-bold">
									{data.topCategory}
								</p>
							</Card>
						</CarouselItem>
					</CarouselContent>
					<CarouselPrevious />
					<CarouselNext />
				</Carousel>
			</div>

			<AnalyticsPanel data={data} />
		</div>
	);
}
