"use client";

import { useMemo, useCallback } from "react";
import { ChartCard } from "@/components/charts/chart-card";
import { EmojiBadge } from "@/components/ui/emoji-badge";
import { useDashboardQuery } from "@/hooks/api/use-analytics-api";
import { useCategoriesQuery } from "@/hooks/api/use-expenses-api";
import { formatCurrency } from "@/lib/format";
import { useUIStore } from "@/store/ui-store";
import type { GlobalDateRange } from "@/lib/date-range";

type Props = {
	range: GlobalDateRange;
	selectedCategoryId?: string;
	onCategorySelect?: (
		categoryId: string | undefined,
	) => void;
};

export function CategoryDistributionBar({
	range,
	selectedCategoryId,
	onCategorySelect,
}: Props) {
	const locale = useUIStore((s) => s.locale);
	const currency = useUIStore((s) => s.currency);
	const categoriesQuery = useCategoriesQuery();

	const { data } = useDashboardQuery({
		preset: range.preset,
	});

	const distribution = data?.rankedCategories ?? [];
	const total = useMemo(
		() => distribution.reduce((s, c) => s + c.value, 0),
		[distribution],
	);

	const categoryNameToId = useMemo(
		() =>
			new Map(
				(categoriesQuery.data ?? []).map((c) => [
					c.name,
					c._id,
				]),
			),
		[categoriesQuery.data],
	);

	const categoryMeta = useMemo(
		() =>
			new Map(
				(categoriesQuery.data ?? []).map((c) => [c.name, c]),
			),
		[categoriesQuery.data],
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
			{total === 0 ? (
				<p className="py-4 text-center text-sm text-[var(--color-muted)]">
					No data
				</p>
			) : (
				<div className="space-y-3">
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
									title={`${item.name}: ${formatCurrency(item.value, currency, locale)} (${pct.toFixed(1)}%)`}
								>
									{pct >= 8 ? `${pct.toFixed(0)}%` : null}
								</button>
							);
						})}
					</div>
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
