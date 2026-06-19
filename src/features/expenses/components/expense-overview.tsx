"use client";

import { FiCalendar } from "react-icons/fi";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/stat-card";
import { DateRangeSelect } from "@/components/charts/date-range-select";
import { formatCurrency } from "@/lib/format";
import { useUIStore } from "@/store/ui-store";
import { IndianRupeeIcon } from "lucide-react";
import type { GlobalDateRange } from "@/lib/date-range";
import type { DashboardAnalytics, DashboardCard } from "@/types/analytics.types";

type ExpenseOverviewProps = {
	data: DashboardAnalytics | undefined;
	isLoading: boolean;
	range: GlobalDateRange;
	onRangeChange: (range: GlobalDateRange) => void;
};

const cardIcons: Record<string, React.ReactNode> = {
	total_spend: (
		<IndianRupeeIcon className="h-5 w-5 text-[var(--color-muted)]" />
	),
	spend_per_day: (
		<FiCalendar className="h-5 w-5 text-[var(--color-muted)]" />
	),
	spend_per_month: (
		<FiCalendar className="h-5 w-5 text-[var(--color-muted)]" />
	),
};

export function ExpenseOverview({
	data,
	isLoading,
	range,
	onRangeChange,
}: ExpenseOverviewProps) {
	const locale = useUIStore((state) => state.locale);
	const currency = useUIStore((state) => state.currency);

	const skeletonCount = range.preset === "day" ? 1 : 2;

	return (
		<div>
			<div className="flex items-center justify-between flex-wrap gap-2 mb-3">
				<h3 className="text-base font-semibold tracking-tight">
					{data?.periodLabel ?? "Overview"}
				</h3>
				<DateRangeSelect
					value={range}
					onChange={(r) => {
						onRangeChange(r);
					}}
				/>
			</div>

			{isLoading || !data ? (
				<div className="flex flex-wrap gap-2">
					{[...Array(skeletonCount)].map((_, i) => (
						<div key={i} className="flex-1 min-w-[calc(50%-0.5rem)]">
							<Card>
								<Skeleton className="h-4 w-24 mb-2" />
								<Skeleton className="h-8 w-32" />
							</Card>
						</div>
					))}
				</div>
			) : (
				<div className="flex flex-wrap gap-2">
					{data.cards.map((card: DashboardCard) => (
						<div
							key={card.key}
							className="flex-1 min-w-[calc(50%-0.5rem)]"
						>
							<StatCard
								icon={cardIcons[card.key]}
								title={card.title}
								value={formatCurrency(
									card.value,
									currency,
									locale,
								)}
							/>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
