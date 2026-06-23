"use client";

import { FiCalendar } from "react-icons/fi";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/stat-card";
import { formatCurrency } from "@/lib/format";
import { useUIStore } from "@/store/ui-store";
import { IndianRupeeIcon } from "lucide-react";
import type {
	DashboardAnalytics,
	DashboardCard,
} from "@/types/analytics.types";

type ExpenseOverviewProps = {
	data: DashboardAnalytics | undefined;
	isLoading: boolean;
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
}: ExpenseOverviewProps) {
	const currency = useUIStore((state) => state.currency);

	return (
		<div>
			{isLoading || !data ? (
				<div className="flex flex-wrap gap-2">
					{[...Array(2)].map((_, i) => (
						<div
							key={i}
							className="flex-1 min-w-[calc(50%-0.5rem)]"
						>
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
								value={formatCurrency(card.value, currency)}
							/>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
