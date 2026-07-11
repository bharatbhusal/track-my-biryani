"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { useAppSelector } from "@/store/hooks";
import { EmojiBadge } from "@/components/ui/emoji-badge";
import { Card } from "@/components/ui/card";
import type { CategoryWithStats } from "@/types/analytics.types";

export function CategoryCard({
	category,
}: {
	category: CategoryWithStats;
}) {
	const currency = useAppSelector((s) => s.ui.currency);

	return (
		<Card>
			<Link href={`/categories/${category._id}`}>
				<div className="flex gap-2">
					<EmojiBadge
						emoji={category.emoji}
						color={category.color}
					/>
					<div className="flex-1 min-w-0">
						<p className="font-medium truncate">
							{category.name}
						</p>

						<p className="text-xs text-[var(--color-muted)]">
							{category.count} expense
							{category.count !== 1 ? "s" : ""}
						</p>
					</div>
					<div className="text-right shrink-0">
						<p className="font-semibold">
							{formatCurrency(category.total, currency)}
						</p>
					</div>
				</div>
				{category?.pct > 0 && (
					<div className="mt-2 flex items-center gap-2">
						<div className="flex-1 h-1.5 rounded-full bg-[var(--color-surface-muted)] overflow-hidden">
							<div
								className="h-full rounded-full transition-all"
								style={{
									width: `${Math.min(category.pct, 100)}%`,
									backgroundColor: category.color,
								}}
							/>
						</div>
						<span className="text-xs text-[var(--color-muted)] tabular-nums w-10 text-right">
							{category.pct.toFixed(1)}%
						</span>
					</div>
				)}
				{category.count >= 2 && (
					<div className="mt-2 flex justify-between gap-2 text-xs text-[var(--color-muted)]">
						<div className="flex gap-1 items-center">
							<p>Avg:</p>
							<p className="font-medium">
								{formatCurrency(category.avg, currency)}
							</p>
						</div>
						<div className="flex gap-1 items-center">
							<p>Min:</p>
							<p className="font-medium">
								{formatCurrency(category.min, currency)}
							</p>
						</div>
						<div className="flex gap-1 items-center">
							<p>Max:</p>
							<p className="font-medium">
								{formatCurrency(category.max, currency)}
							</p>
						</div>
					</div>
				)}
			</Link>
		</Card>
	);
}
