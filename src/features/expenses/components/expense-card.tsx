"use client";

import Link from "next/link";
import type {
	CategoryItem,
	ExpenseItem,
} from "@/types/expense.types";
import { formatCurrency, formatDate } from "@/lib/format";
import { useUIStore } from "@/store/ui-store";

type Props = {
	expense: ExpenseItem;
	category?: CategoryItem;
};

export function ExpenseCard({ expense, category }: Props) {
	const locale = useUIStore((s) => s.locale);
	const timezone = useUIStore((s) => s.timezone);

	return (
		<Link
			href={`/expenses/${expense._id}`}
			className="block rounded-md border border-[var(--color-border)] p-3 hover:bg-[color-mix(in_oklab,var(--color-bg)_96%,transparent)]"
		>
			<div className="flex items-start justify-between">
				<div>
					<p className="font-medium">{expense.title}</p>
					<p className="text-xs text-[var(--color-muted)]">
						{category?.emoji ?? "🏷️"} {category?.name ?? "Category"}
					</p>
					<p className="text-xs text-[var(--color-muted)]">
						{formatDate(expense.dateTime, locale, timezone)}
					</p>
				</div>
				<div className="text-right">
					<p className="font-semibold">
						{formatCurrency(
							expense.amount,
							expense.currency,
							locale,
						)}
					</p>
				</div>
			</div>
		</Link>
	);
}
