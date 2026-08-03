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
import { useRouter } from "next/navigation";

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
	const currentUserId = useAppSelector(
		(s) => s.auth.user?.id,
	);
	const isOwner =
		!!currentUserId && expense.userId === currentUserId;
	const hasActions = isOwner && (onEdit || onDelete);
	const router = useRouter();

	return (
		<Card
			className={`block rounded-md border border-[var(--color-border)] p-3 ${!hasActions ? "hover:bg-[color-mix(in_oklab,var(--color-bg)_96%,transparent)]" : ""}`}
		>
			<div
				onClick={
					!hasActions
						? () => router.replace(`/expenses/${expense._id}`)
						: undefined
				}
				className={!hasActions ? "cursor-pointer" : ""}
			>
				<div className="flex gap-2 items-center justify-between">
					<div className="flex gap-2 items-center text-medium min-w-0 flex-1">
						<div className="shrink-0">
							<EmojiBadge
								color={expense?.categoryColor || ""}
								emoji={expense?.categoryEmoji}
								className="flex-1"
							/>
						</div>

						<div className="flex flex-col min-w-0">
							<p className="font-medium break-words leading-5">
								{expense.title
									? expense.title.charAt(0).toUpperCase() +
										expense.title.slice(1)
									: expense.title}
							</p>
							<p className="text-xs text-[var(--color-muted)]">
								{formatShortDateTime(expense.paidAt)}
							</p>
							{expense.posterName && (
								<p className="text-xs text-[var(--color-muted)]">
									by {expense.posterName}
								</p>
							)}
						</div>
					</div>
					<div className="flex gap-2 items-center shrink-0">
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
										className="h-8 w-8  cursor-pointer"
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
										className="h-8 w-8  cursor-pointer"
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
			</div>
		</Card>
	);
}
