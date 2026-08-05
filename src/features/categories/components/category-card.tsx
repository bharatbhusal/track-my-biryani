"use client";

import Link from "next/link";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { formatCurrency } from "@/lib/format";
import { useAppSelector } from "@/store/hooks";
import { EmojiBadge } from "@/components/ui/emoji-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CategoryWithStats } from "@/types/analytics.types";

type CategoryCardProps = {
	category: CategoryWithStats;
	onEdit?: () => void;
	onDelete?: () => void;
};

export function CategoryCard({
	category,
	onEdit,
	onDelete,
}: CategoryCardProps) {
	const currency = useAppSelector((s) => s.ui.currency);
	const hasActions = onEdit || onDelete;

	return (
		<Card>
			<Link href={`/categories/${category._id}`}>
				<div className="flex gap-2 items-center">
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
					{hasActions && (
						<div className="flex gap-1">
							{onEdit && (
								<Button
									variant="outline"
									size="icon"
									className="h-8 w-8"
									aria-label="Edit category"
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										onEdit();
									}}
								>
									<FiEdit2 className="h-4 w-4" />
								</Button>
							)}
							{onDelete && (
								<Button
									variant="destructive"
									size="icon"
									className="h-8 w-8"
									aria-label="Delete category"
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										onDelete();
									}}
								>
									<FiTrash2 className="h-4 w-4" />
								</Button>
							)}
						</div>
					)}
				</div>
				{category.pct > 0 && (
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
					<div className="mt-2 flex justify-between gap-2 text-sm">
						<div className="flex gap-1 items-center">
							<p className="text-[var(--color-muted)]">Avg:</p>
							<p className="font-medium">
								{formatCurrency(category.avg, currency)}
							</p>
						</div>
						<div className="flex gap-1 items-center">
							<p className="text-[var(--color-muted)]">Min:</p>
							<p className="font-medium">
								{formatCurrency(category.min, currency)}
							</p>
						</div>
						<div className="flex gap-1 items-center">
							<p className="text-[var(--color-muted)]">Max:</p>
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
