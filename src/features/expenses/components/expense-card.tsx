"use client";

import Link from "next/link";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import type { ExpenseItem } from "@/types/expense.types";
import { formatCurrency } from "@/lib/format";
import { useAppSelector } from "@/store/hooks";
import { EmojiBadge } from "@/components/ui/emoji-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatShortDateTime } from "@/lib/datetime";

type Props = {
	expense: ExpenseItem;
	onEdit?: () => void;
	onDelete?: () => void;
};

export function ExpenseCard({
	expense,
	onEdit,
	onDelete,
}: Props) {
	const currency = useAppSelector((s) => s.ui.currency);
	const hasActions = onEdit || onDelete;

	return (
		<Card className="block rounded-md border border-[var(--color-border)] p-3 hover:bg-[color-mix(in_oklab,var(--color-bg)_96%,transparent)]">
			<Link href={`/expenses/${expense._id}`}>
				<div className="flex gap-2 items-center justify-between">
					<div className="flex gap-2 items-center text-medium">
						<EmojiBadge
							color={expense?.categoryColor || ""}
							emoji={expense?.categoryEmoji}
							className="flex-1"
						/>

						<div className="flex flex-col">
							<p className="font-medium truncate">
								{expense.title}
							</p>
							<p className="text-xs text-[var(--color-muted)]">
								{formatShortDateTime(expense.paidAt)}
							</p>
						</div>
					</div>
					<div className="flex gap-2 items-center">
						<div className="text-right shrink-0">
							<p className="font-semibold">
								{formatCurrency(expense.amount, currency)}
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
										onClick={onEdit}
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
										onClick={onDelete}
									>
										<FiTrash2 className="h-4 w-4" />
									</Button>
								)}
							</div>
						)}
					</div>
				</div>
				{expense.notes && (
					<p className="text-sm border-t-2 mt-4 py-2 text-[var(--color-muted)]">
						{expense.notes}
					</p>
				)}
			</Link>
		</Card>
	);
}
