"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
	FiEdit2,
	FiExternalLink,
	FiTrash2,
} from "react-icons/fi";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
	useCategoriesQuery,
	useExpenseMutations,
	useExpensesQuery,
} from "@/hooks/api/use-expenses-api";
import { formatCurrency, formatDate } from "@/lib/format";
import { useUIStore } from "@/store/ui-store";

export function ExpenseManager() {
	const locale = useUIStore((state) => state.locale);
	const timezone = useUIStore((state) => state.timezone);
	const setQuickAddOpen = useUIStore(
		(state) => state.setQuickAddOpen,
	);
	const { deleteExpense } = useExpenseMutations();
	const [query, setQuery] = useState("");
	const [categoryId, setCategoryId] = useState("");
	const [sortBy, setSortBy] = useState<
		"dateTime" | "amount" | "title"
	>("dateTime");
	const [order, setOrder] = useState<"asc" | "desc">("desc");
	const [page, setPage] = useState(1);

	const categoriesQuery = useCategoriesQuery();
	const filters = useMemo(
		() => ({
			page,
			limit: 20,
			q: query || undefined,
			categoryId: categoryId || undefined,
			sortBy,
			order,
		}),
		[categoryId, order, page, query, sortBy],
	);
	const expensesQuery = useExpensesQuery(filters);
	const items = expensesQuery.data?.items ?? [];
	const totalPages = expensesQuery.data?.totalPages ?? 1;

	return (
		<div className="space-y-4">
			<Card>
				<div className="mb-3 flex items-center justify-between gap-2">
					<CardTitle>Expense List</CardTitle>
					<Button
						type="button"
						onClick={() => setQuickAddOpen(true)}
					>
						Add Expense
					</Button>
				</div>

				<div className="grid grid-cols-1 gap-2 md:grid-cols-4">
					<Input
						placeholder="Search title"
						value={query}
						onChange={(event) => {
							setQuery(event.target.value);
							setPage(1);
						}}
					/>
					<Select
						value={categoryId}
						onChange={(event) => {
							setCategoryId(event.target.value);
							setPage(1);
						}}
					>
						<option value="">All categories</option>
						{(categoriesQuery.data ?? []).map((category) => (
							<option key={category._id} value={category._id}>
								{category.name}
							</option>
						))}
					</Select>
					<Select
						value={sortBy}
						onChange={(event) =>
							setSortBy(
								event.target.value as
									| "dateTime"
									| "amount"
									| "title",
							)
						}
					>
						<option value="dateTime">Newest</option>
						<option value="amount">Amount</option>
						<option value="title">Alphabetical</option>
					</Select>
					<Select
						value={order}
						onChange={(event) =>
							setOrder(event.target.value as "asc" | "desc")
						}
					>
						<option value="desc">Descending</option>
						<option value="asc">Ascending</option>
					</Select>
				</div>
			</Card>

			<Card>
				<CardTitle className="mb-3">Expenses</CardTitle>
				<ul className="space-y-2 text-sm">
					{items.map((expense) => (
						<li
							key={expense._id}
							className="flex items-center justify-between rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
						>
							<div>
								<p className="font-medium">{expense.title}</p>
								<p className="text-xs text-zinc-500">
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
								<div className="mt-1 flex items-center justify-end gap-1">
									<Link href={`/expenses/${expense._id}`}>
										<Button
											variant="ghost"
											className="h-8 w-8 p-0"
											aria-label="View expense details"
										>
											<FiExternalLink />
										</Button>
									</Link>
									<Link href={`/expenses/${expense._id}/edit`}>
										<Button
											variant="ghost"
											className="h-8 w-8 p-0"
											aria-label="Edit expense"
										>
											<FiEdit2 />
										</Button>
									</Link>
									<Button
										variant="ghost"
										className="h-8 w-8 p-0 text-red-600"
										aria-label="Delete expense"
										onClick={async () => {
											try {
												await deleteExpense.mutateAsync(expense._id);
												toast.success("Expense deleted");
											} catch (error) {
												toast.error(
													error instanceof Error
														? error.message
														: "Delete failed",
												);
											}
										}}
									>
										<FiTrash2 />
									</Button>
								</div>
							</div>
						</li>
					))}
				</ul>

				<div className="mt-3 flex items-center justify-between text-sm">
					<p className="text-[var(--color-muted)]">
						Page {page} of {totalPages}
					</p>
					<div className="flex gap-2">
						<Button
							variant="outline"
							disabled={page <= 1}
							onClick={() =>
								setPage((current) => Math.max(1, current - 1))
							}
						>
							Previous
						</Button>
						<Button
							variant="outline"
							disabled={page >= totalPages}
							onClick={() =>
								setPage((current) =>
									Math.min(totalPages, current + 1),
								)
							}
						>
							Next
						</Button>
					</div>
				</div>
			</Card>
		</div>
	);
}
