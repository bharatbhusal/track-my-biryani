"use client";

import { useMemo, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounce";

import { Button } from "@/components/ui/button";
import { ExpenseCard } from "@/features/expenses/components/expense-card";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
	useCategoriesQuery,
	useExpensesQuery,
} from "@/hooks/api/use-expenses-api";
import { toIsoBounds } from "@/lib/date-range";
import { useUIStore } from "@/store/ui-store";
import { useDateRange } from "@/components/charts/date-range-context";

export function ExpenseManager() {
	const setQuickAddOpen = useUIStore(
		(state) => state.setQuickAddOpen,
	);
	const [query, setQuery] = useState("");
	const [categoryId, setCategoryId] = useState("");
	const [sortBy, setSortBy] = useState<
		"dateTime" | "amount" | "title"
	>("dateTime");
	const [order, setOrder] = useState<"asc" | "desc">("desc");
	const [amountMin, setAmountMin] = useState("");
	const [amountMax, setAmountMax] = useState("");
	const [page, setPage] = useState(1);
	const { range: localRange } = useDateRange();

	const categoriesQuery = useCategoriesQuery();
	const debouncedQuery = useDebouncedValue(query, 300);

	const filters = useMemo(() => {
		const bounds = toIsoBounds(localRange);
		return {
			page,
			limit: 20,
			q: debouncedQuery || undefined,
			categoryId: categoryId || undefined,
			from: bounds.from,
			to: bounds.to,
			sortBy,
			order,
		};
	}, [
		categoryId,
		localRange,
		order,
		page,
		debouncedQuery,
		sortBy,
	]);
	const expensesQuery = useExpensesQuery(filters);
	const items = expensesQuery.data?.items ?? [];
	const totalPages = expensesQuery.data?.totalPages ?? 1;
	const categoryMap = useMemo(
		() =>
			new Map(
				(categoriesQuery.data ?? []).map((category) => [
					category._id,
					category,
				]),
			),
		[categoriesQuery.data],
	);

	return (
		<div className="space-y-4">
			<Card data-animate="true">
				<div className="mb-3 flex items-center justify-between gap-2">
					<CardTitle>Expense List</CardTitle>
					<Button
						type="button"
						onClick={() => setQuickAddOpen(true)}
					>
						Add Expense
					</Button>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Input
						placeholder="Search title, notes, payment"
						value={query}
						className="min-w-48 flex-1"
						onChange={(event) => {
							setQuery(event.target.value);
							setPage(1);
						}}
					/>
					<Select
						value={categoryId}
						className="w-44"
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
						className="w-36"
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
						className="w-36"
						onChange={(event) =>
							setOrder(event.target.value as "asc" | "desc")
						}
					>
						<option value="desc">Descending</option>
						<option value="asc">Ascending</option>
					</Select>
				</div>
			</Card>

			<Card data-animate="true">
				<CardTitle className="mb-3">Expenses</CardTitle>
				<ul className="space-y-2 text-sm">
					{items.map((expense) => (
						<li key={expense._id} data-animate="true">
							<ExpenseCard
								expense={expense}
								category={categoryMap.get(expense.categoryId)}
							/>
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
