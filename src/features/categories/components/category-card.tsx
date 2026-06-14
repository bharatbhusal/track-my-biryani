"use client";

import Link from "next/link";
import type { CategoryItem } from "@/types/expense.types";
import { formatCurrency } from "@/lib/format";
import { useUIStore } from "@/store/ui-store";
import { EmojiBadge } from "@/components/ui/emoji-badge";

type Props = {
	category: CategoryItem;
	amount?: number;
};

export function CategoryCard({ category, amount }: Props) {
	const locale = useUIStore((s) => s.locale);
	const currency = useUIStore((s) => s.currency);

	return (
		<Link
			href={`/categories/${category._id}`}
			className="block rounded-md border border-[var(--color-border)] p-3 hover:bg-[color-mix(in_oklab,var(--color-bg)_96%,transparent)]"
		>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<EmojiBadge
						emoji={category.emoji}
						color={category.color}
					/>
					<p className="font-medium">{category.name}</p>
				</div>
				{typeof amount === "number" && (
					<p className="font-semibold">
						{formatCurrency(amount, currency, locale)}
					</p>
				)}
			</div>
		</Link>
	);
}
