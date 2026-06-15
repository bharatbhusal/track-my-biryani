"use client";

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
import { useUIStore } from "@/store/ui-store";
import { ExpenseCard } from "@/features/expenses/components/expense-card";
import type {
	CategoryItem,
	ExpenseItem,
} from "@/types/expense.types";
import { EmojiBadge } from "@/components/ui/emoji-badge";

export type SortField = "dateTime" | "amount" | "title";

type ExpenseTableProps = {
	items: ExpenseItem[];
	categoryMap: Map<string, CategoryItem>;
	isLoading?: boolean;
	sortBy?: SortField;
	order?: "asc" | "desc";
	onSort?: (field: SortField) => void;
	page?: number;
	totalPages?: number;
	onPageChange?: (page: number) => void;
	emptyMessage?: string;
};

export function ExpenseTable({
	items,
	categoryMap,
	isLoading,
	sortBy,
	order,
	onSort,
	page,
	totalPages,
	onPageChange,
	emptyMessage = "No expenses found",
}: ExpenseTableProps) {
	const locale = useUIStore((state) => state.locale);
	const timezone = useUIStore((state) => state.timezone);
	const currency = useUIStore((state) => state.currency);

	const renderSortIcon = (field: SortField) => {
		if (sortBy !== field || !order) return null;
		return order === "asc" ? (
			<FiArrowUp className="ml-1 inline h-3 w-3" />
		) : (
			<FiArrowDown className="ml-1 inline h-3 w-3" />
		);
	};

	return (
		<>
			{/* Mobile: card layout */}
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
					items.map((expense) => (
						<ExpenseCard
							key={expense._id}
							expense={expense}
							category={categoryMap.get(expense.categoryId)}
						/>
					))
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
								onClick={() => onSort?.("dateTime")}
							>
								Date
								{renderSortIcon("dateTime")}
							</TableHead>
							<TableHead className="w-12">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							[...Array(5)].map((_, i) => (
								<TableRow key={i}>
									<TableCell><Skeleton className="h-4 w-32" /></TableCell>
									<TableCell><Skeleton className="h-4 w-24" /></TableCell>
									<TableCell><Skeleton className="h-4 w-16" /></TableCell>
									<TableCell><Skeleton className="h-4 w-20" /></TableCell>
									<TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
								</TableRow>
							))
						) : items.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={5}
									className="py-8 text-center text-[var(--color-muted)]"
								>
									{emptyMessage}
								</TableCell>
							</TableRow>
						) : (
							items.map((expense) => {
								const cat = categoryMap.get(expense.categoryId);
								return (
									<TableRow key={expense._id}>
										<TableCell className="font-medium">
											{expense.title}
										</TableCell>
										<TableCell>
											<span className="text-md flex gap-2 items-center">
												<EmojiBadge
													color={cat?.color ?? "var(--color-muted)"}
													emoji={cat?.emoji}
												/>
												{cat?.name ?? "Unknown"}
											</span>
										</TableCell>
										<TableCell className="font-semibold">
											{formatCurrency(
												expense.amount,
												expense.currency || currency,
												locale,
											)}
										</TableCell>
										<TableCell className="text-xs text-[var(--color-muted)]">
											{formatDate(expense.dateTime, locale, timezone)}
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
								);
							})
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
