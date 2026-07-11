"use client";

import { useMemo, useCallback } from "react";
import { ChartCard } from "@/components/charts/chart-card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { useAppSelector } from "@/store/hooks";
import type { CategoryBreakdownPoint } from "@/types/analytics.types";
import type { CategoryItem } from "@/types/expense.types";

type Props = {
	distribution: CategoryBreakdownPoint[];
	categories: CategoryItem[];
	selectedCategoryId?: string;
	onCategorySelect: (id: string | undefined) => void;
	isLoading?: boolean;
};

export function CategoryDistributionBar({
	distribution,
	categories,
	selectedCategoryId,
	onCategorySelect,
	isLoading,
}: Props) {
	const currency = useAppSelector((s) => s.ui.currency);

	const total = useMemo(
		() => distribution.reduce((s, c) => s + c.value, 0),
		[distribution],
	);

	const categoryNameToId = useMemo(
		() => new Map(categories.map((c) => [c.name, c._id])),
		[categories],
	);

	const categoryMeta = useMemo(
		() => new Map(categories.map((c) => [c.name, c])),
		[categories],
	);

	const toggle = useCallback(
		(catId: string | undefined) => {
			onCategorySelect?.(
				selectedCategoryId === catId ? undefined : catId,
			);
		},
		[onCategorySelect, selectedCategoryId],
	);

	return (
		<ChartCard title="Category Distribution">
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
							{distribution.map((item) => {
								const cat = categoryMeta.get(item.name);
								const pct = (item.value / total) * 100;
								const catId = categoryNameToId.get(item.name);
								if (pct < 0.5) return null;

								const isSelected =
									selectedCategoryId !== undefined &&
									selectedCategoryId === catId;

								return (
									<button
										key={item.name}
										type="button"
										onClick={() => toggle(catId)}
										className={`flex items-center justify-center text-[15px] font-bold text-white transition-all hover:opacity-80 rounded-[4px] ${
											selectedCategoryId && !isSelected
												? "opacity-30"
												: ""
										}`}
										style={{
											width: `${pct}%`,
											backgroundColor:
												cat?.color ?? "var(--color-muted)",
											outline: isSelected
												? "2px solid var(--color-foreground)"
												: undefined,
											outlineOffset: "-2px",
										}}
										title={`${item.name}: ${formatCurrency(item.value, currency)} (${pct.toFixed(1)}%)`}
									>
										{pct >= 8 ? `${pct.toFixed(0)}%` : null}
									</button>
								);
							})}
						</div>
					) : (
						<div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
							No Data
						</div>
					)}
					<div className="flex flex-wrap gap-x-4 gap-y-2">
						{distribution.map((item) => {
							const cat = categoryMeta.get(item.name);
							const catId = categoryNameToId.get(item.name);
							const isSelected =
								selectedCategoryId !== undefined &&
								selectedCategoryId === catId;

							return (
								<button
									key={item.name}
									type="button"
									onClick={() => toggle(catId)}
									className={`flex items-center gap-2 text-sm transition-all hover:opacity-80 ${
										selectedCategoryId && !isSelected
											? "opacity-30"
											: ""
									}`}
								>
									<span
										className={`p-2 rounded-full`}
										style={{
											backgroundColor:
												cat?.color ?? "var(--color-muted)",
										}}
									></span>
									<span>{item.name}</span>
								</button>
							);
						})}
					</div>
				</div>
			)}
		</ChartCard>
	);
}
