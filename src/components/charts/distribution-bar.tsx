"use client";

import { useMemo } from "react";
import { ChartCard } from "@/components/charts/chart-card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { useAppSelector } from "@/store/hooks";
import type { DistributionPoint } from "@/types/analytics.types";

type DistributionBarProps = {
	title: string;
	data: DistributionPoint[];
	selectedIds?: string[];
	isLoading?: boolean;
};

// ponytail: no color palette dep — hash the id to a stable HSL so the same
// owner/bucket keeps its color across renders.
function stableColor(id: string): string {
	let hash = 0;
	for (let i = 0; i < id.length; i++) {
		hash = (hash << 5) - hash + id.charCodeAt(i);
		hash |= 0;
	}
	const hue = Math.abs(hash) % 360;
	return `hsl(${hue}, 65%, 55%)`;
}

export function DistributionBar({
	title,
	data,
	selectedIds,
	isLoading,
}: DistributionBarProps) {
	const currency = useAppSelector((s) => s.ui.currency);

	const total = useMemo(
		() => data.reduce((s, d) => s + d.value, 0),
		[data],
	);

	const hasSelection = (selectedIds?.length ?? 0) > 0;

	return (
		<ChartCard title={title}>
			{isLoading ? (
				<div className="space-y-3">
					<Skeleton className="h-10 w-full rounded-md" />
					<div className="flex flex-wrap gap-x-4 gap-y-2">
						{[...Array(4)].map((_, i) => (
							<div key={i} className="flex items-center gap-2">
								<Skeleton className="h-3 w-3 rounded-full" />
								<Skeleton className="h-4 w-20" />
							</div>
						))}
					</div>
				</div>
			) : (
				<div className="space-y-2">
					{total > 1 ? (
						<div className="flex h-10 w-full overflow-hidden gap-1 sm:gap-2 rounded-md">
							{data.map((item) => {
								const pct = (item.value / total) * 100;
								if (pct < 0.5) return null;

								const isSelected = selectedIds?.includes(item.id) ?? false;

								return (
									<div
										key={item.id}
										className={`flex items-center justify-center text-[15px] font-bold text-white transition-all rounded-[4px] ${
											hasSelection && !isSelected ? "opacity-30" : ""
										}`}
										style={{
											width: `${pct}%`,
											backgroundColor:
												item.color ?? stableColor(item.id),
											outline:
												hasSelection && isSelected
													? "2px solid var(--color-foreground)"
													: undefined,
											outlineOffset: "-2px",
										}}
										title={`${item.name}: ${formatCurrency(item.value, currency)} (${pct.toFixed(1)}%)`}
									>
										{pct > 10 ? `${pct.toFixed(0)}%` : null}
									</div>
								);
							})}
						</div>
					) : (
						<div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
							No Data
						</div>
					)}
					<div className="flex items-center gap-4 overflow-x-auto py-1">
						{data.map((item) => {
							const isSelected = selectedIds?.includes(item.id) ?? false;

							return (
								<div
									key={item.id}
									className={`flex shrink-0 items-center gap-2 whitespace-nowrap text-sm transition-all ${
										hasSelection && !isSelected ? "opacity-30" : ""
									}`}
								>
									<span
										className="p-2 rounded-full"
										style={{
											backgroundColor:
												item.color ?? stableColor(item.id),
										}}
									></span>
									{item.icon && <span>{item.icon}</span>}
									<span>{item.name}</span>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</ChartCard>
	);
}
