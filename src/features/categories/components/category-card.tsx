"use client";

import Link from "next/link";
import type { CategoryItem } from "@/types/expense.types";
import { formatCurrency } from "@/lib/format";
import { useAppSelector } from "@/store/hooks";
import { EmojiBadge } from "@/components/ui/emoji-badge";
import { Card } from "@/components/ui/card";

type Props = {
	category: CategoryItem;
	amount?: number;
	count?: number;
	totalSpend?: number;
};

export function CategoryCard({
	category,
	amount,
	count,
	totalSpend,
}: Props) {
	const currency = useAppSelector((s) => s.ui.currency);

	const pct =
		typeof amount === "number" &&
		typeof totalSpend === "number" &&
		totalSpend > 0
			? (amount / totalSpend) * 100
			: undefined;

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
						{typeof count === "number" && (
							<p className="text-xs text-[var(--color-muted)]">
								{count} expense{count !== 1 ? "s" : ""}
							</p>
						)}
					</div>
					<div className="text-right shrink-0">
						{typeof amount === "number" && (
							<p className="font-semibold">
								{formatCurrency(amount, currency)}
							</p>
						)}
					</div>
				</div>
				{typeof pct === "number" && (
					<div className="mt-2 flex items-center gap-2">
						<div className="flex-1 h-1.5 rounded-full bg-[var(--color-surface-muted)] overflow-hidden">
							<div
								className="h-full rounded-full transition-all"
								style={{
									width: `${Math.min(pct, 100)}%`,
									backgroundColor: category.color,
								}}
							/>
						</div>
						<span className="text-xs text-[var(--color-muted)] tabular-nums">
							{pct.toFixed(1)}%
						</span>
					</div>
				)}
			</Link>
		</Card>
	);
}
