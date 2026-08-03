import { useMemo } from "react";
import Link from "next/link";
import {
	FiChevronLeft,
	FiChevronRight,
	FiArrowUp,
	FiArrowDown,
	FiEye,
} from "react-icons/fi";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAppSelector } from "@/store/hooks";
import { ExpenseCard } from "@/features/expenses/components/expense-card";
import type { ExpenseItem } from "@/types/expense.types";
import { EmojiBadge } from "@/components/ui/emoji-badge";
import { formatShortDate } from "@/lib/datetime";

export type SortField = "paidAt" | "amount" | "title";

type ExpenseTableProps = {
	items: ExpenseItem[];
	isLoading?: boolean;
	sortBy?: SortField;
	order?: "asc" | "desc";
	onSort?: (field: SortField) => void;
	page?: number;
	totalPages?: number;
	onPageChange?: (page: number) => void;
	emptyMessage?: string;
	showPoster?: boolean;
};

function groupByDate(
	items: ExpenseItem[],
): Map<string, ExpenseItem[]> {
	const map = new Map<string, ExpenseItem[]>();
	for (const item of items) {
		const date = new Date(item.paidAt)
			.toISOString()
			.split("T")[0];
		if (!map.has(date)) map.set(date, []);
		map.get(date)!.push(item);
	}
	return map;
}

export function ExpenseTable({
	items,
	isLoading,
	sortBy,
	order,
	onSort,
	page,
	totalPages,
	onPageChange,
	emptyMessage = "No expenses found",
	showPoster = false,
}: Omit<ExpenseTableProps, "categoryMap">) {
	const locale = useAppSelector((s) => s.ui.locale);
	const timezone = useAppSelector((s) => s.ui.timezone);
	const currency = useAppSelector((s) => s.ui.currency);

	const renderSortIcon = (field: SortField) => {
		if (sortBy !== field || !order) return null;
		return order === "asc" ? (
			<FiArrowUp className="ml-1 inline h-3 w-3" />
		) : (
			<FiArrowDown className="ml-1 inline h-3 w-3" />
		);
	};

	const groupedItems = useMemo(
		() => groupByDate(items),
		[items],
	);

	return (
		<>
			{/* Mobile: card layout grouped by day */}
			<div className="space-y-2 md:hidden">
				{isLoading ? (
					[...Array(5)].map((_, i) => (
						<div
							key={i}
							className="flex gap-2 rounded-md border border-[var(--color-border)] p-3"
						>
							<Skeleton className="h-10 w-10 rounded-lg shrink-0" />
							<div className="flex-1 space-y-1.5">
								<Skeleton className="h-4 w-3/4" />
								<Skeleton className="h-3 w-1/2" />
							</div>
							<Skeleton className="h-5 w-16 self-center" />
						</div>
					))
				) : items.length === 0 ? (
					<p className="py-8 text-center text-sm text-[var(--color-muted)]">
						{emptyMessage}
					</p>
				) : (
					Array.from(groupedItems.entries()).map(
						([date, dayItems]) => {
							const dayTotal = dayItems.reduce(
								(sum, expense) => sum + expense.amount,
								0,
							);
							return (
								<div key={date} className="space-y-2">
									<div className="flex items-center justify-between px-2 py-1">
										<span className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wide">
											{formatShortDate(date, locale)}
										</span>
										<span className="text-xs font-semibold text-[var(--color-muted)]">
											{formatCurrency(dayTotal, currency)}
										</span>
									</div>
									{dayItems.map((expense) => (
										<ExpenseCard
											key={expense._id}
											expense={expense}
										/>
									))}
								</div>
							);
						},
					)
				)}
			</div>

			{/* Desktop: table */}
			<div className="hidden overflow-x-auto md:block">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead
								className={
									onSort ? "cursor-pointer select-none" : ""
								}
								onClick={() => onSort?.("title")}
							>
								Title
								{renderSortIcon("title")}
							</TableHead>
							<TableHead>Category</TableHead>
							{showPoster && <TableHead>Posted by</TableHead>}
							<TableHead
								className={
									onSort ? "cursor-pointer select-none" : ""
								}
								onClick={() => onSort?.("amount")}
							>
								Amount
								{renderSortIcon("amount")}
							</TableHead>
							<TableHead
								className={
									onSort ? "cursor-pointer select-none" : ""
								}
								onClick={() => onSort?.("paidAt")}
							>
								Date
								{renderSortIcon("paidAt")}
							</TableHead>
							<TableHead className="w-12">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							[...Array(5)].map((_, i) => (
								<TableRow key={i}>
									<TableCell>
										<Skeleton className="h-4 w-32" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-24" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-16" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-20" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-8 w-8 rounded-md" />
									</TableCell>
								</TableRow>
							))
						) : items.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={showPoster ? 6 : 5}
									className="py-8 text-center text-[var(--color-muted)]"
								>
									{emptyMessage}
								</TableCell>
							</TableRow>
						) : (
							items.map((expense) => (
								<TableRow key={expense._id}>
									<TableCell className="font-medium">
										{expense.title}
									</TableCell>
									<TableCell>
										<span className="text-md flex gap-2 items-center">
											<EmojiBadge
												color={
													expense.categoryColor ?? "var(--color-muted)"
												}
												emoji={expense.categoryEmoji}
											/>
											{expense.categoryEmoji ? "" : "Unknown"}
										</span>
									</TableCell>
									{showPoster && (
										<TableCell className="text-xs text-[var(--color-muted)]">
											{expense.posterName ?? "—"}
										</TableCell>
									)}
									<TableCell className="font-semibold">
										{formatCurrency(
											expense.amount,
											expense.currency || currency,
										)}
									</TableCell>
									<TableCell className="text-xs text-[var(--color-muted)]">
										{formatDate(expense.paidAt, locale, timezone)}
									</TableCell>
									<TableCell>
										<Link href={`/expenses/${expense._id}`}>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8"
												aria-label="View expense"
											>
												<FiEye className="h-4 w-4" />
											</Button>
										</Link>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination */}
			{page !== undefined &&
				totalPages !== undefined &&
				totalPages > 1 &&
				onPageChange && (
					<div className="mt-3 flex items-center justify-center gap-3 text-sm">
						<Button
							variant="outline"
							size="icon"
							onClick={() =>
								onPageChange(page <= 1 ? totalPages : page - 1)
							}
							aria-label="Previous page"
						>
							<FiChevronLeft className="h-4 w-4" />
						</Button>
						<p className="text-[var(--color-muted)]">
							{page} / {totalPages}
						</p>
						<Button
							variant="outline"
							size="icon"
							onClick={() =>
								onPageChange(page >= totalPages ? 1 : page + 1)
							}
							aria-label="Next page"
						>
							<FiChevronRight className="h-4 w-4" />
						</Button>
					</div>
				)}
		</>
	);
}
