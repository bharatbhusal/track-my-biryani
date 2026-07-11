"use client";

import Link from "next/link";
import type {
	CategoryItem,
	ExpenseItem,
} from "@/types/expense.types";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAppSelector } from "@/store/hooks";
import { EmojiBadge } from "@/components/ui/emoji-badge";

type Props = {
	expense: ExpenseItem;
	category?: CategoryItem;
};

export function ExpenseCard({ expense, category }: Props) {
	const locale = useAppSelector((s) => s.ui.locale);
	const currency = useAppSelector((s) => s.ui.currency);
	const timezone = useAppSelector((s) => s.ui.timezone);

	return (
		<Link
			href={`/expenses/${expense._id}`}
			className="block rounded-md border border-[var(--color-border)] p-3 hover:bg-[color-mix(in_oklab,var(--color-bg)_96%,transparent)]"
		>
			<div className="flex gap-2">
				<EmojiBadge
					color={category?.color || ""}
					emoji={category?.emoji}
					className="flex-1"
				/>
				<div className="flex-4">
					<p className="font-medium">{expense.title}</p>

					<p className="text-xs text-[var(--color-muted)]">
						{formatDate(expense.paidAt, locale, timezone)}
					</p>
				</div>
				<div className="text-right flex-1">
					<p className="font-semibold">
						{formatCurrency(expense.amount, currency)}
					</p>
				</div>
			</div>
		</Link>
	);
}
