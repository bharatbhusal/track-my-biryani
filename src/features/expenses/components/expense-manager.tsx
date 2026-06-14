"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
	FiChevronLeft,
	FiChevronRight,
	FiPlus,
	FiSearch,
	FiArrowUp,
	FiArrowDown,
	FiEye,
} from "react-icons/fi";
import { useDebouncedValue } from "@/hooks/use-debounce";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	useCategoriesQuery,
	useExpensesQuery,
} from "@/hooks/api/use-expenses-api";
import { toIsoBounds } from "@/lib/date-range";
import { formatCurrency, formatDate } from "@/lib/format";
import { useUIStore } from "@/store/ui-store";
import { useDateRange } from "@/components/charts/date-range-context";

type SortField = "dateTime" | "amount" | "title";

export function ExpenseManager() {
	const setQuickAddOpen = useUIStore(
		(state) => state.setQuickAddOpen,
	);
	const locale = useUIStore((state) => state.locale);
	const timezone = useUIStore((state) => state.timezone);
	const currency = useUIStore((state) => state.currency);
	const [query, setQuery] = useState("");
	const [categoryId, setCategoryId] = useState("");
	const [sortBy, setSortBy] =
		useState<SortField>("dateTime");
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
			amountMin: amountMin ? Number(amountMin) : undefined,
			amountMax: amountMax ? Number(amountMax) : undefined,
		};
	}, [
		categoryId,
		localRange,
		order,
		page,
		debouncedQuery,
		sortBy,
		amountMin,
		amountMax,
	]);

	const expensesQuery = useExpensesQuery(filters);
	const items = expensesQuery.data?.items ?? [];
	const totalPages = expensesQuery.data?.totalPages ?? 1;

	const categoryMap = useMemo(
		() =>
			new Map(
				(categoriesQuery.data ?? []).map((cat) => [
					cat._id,
					cat,
				]),
			),
		[categoriesQuery.data],
	);

	const handleSort = (field: SortField) => {
		if (sortBy === field) {
			setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
		} else {
			setSortBy(field);
			setOrder("desc");
		}
		setPage(1);
	};

	const renderSortIcon = (field: SortField) => {
		if (sortBy !== field) return null;
		return order === "asc" ? (
			<FiArrowUp className="ml-1 inline h-3 w-3" />
		) : (
			<FiArrowDown className="ml-1 inline h-3 w-3" />
		);
	};

	return (
		<div className="space-y-4">
			<Card>
				<div className="mb-3 flex items-center justify-between gap-2">
					<CardTitle>Expenses</CardTitle>
					<Button onClick={() => setQuickAddOpen(true)}>
						<FiPlus className="mr-1.5 h-4 w-4" />
						Add Expense
					</Button>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<div className="relative min-w-48 flex-1">
						<FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted)]" />
						<Input
							placeholder="Search title, notes, payment..."
							value={query}
							className="pl-9"
							onChange={(e) => {
								setQuery(e.target.value);
								setPage(1);
							}}
						/>
					</div>
					<Select
						value={categoryId}
						className="w-40"
						onChange={(e) => {
							setCategoryId(e.target.value);
							setPage(1);
						}}
					>
						<option value="">All categories</option>
						{(categoriesQuery.data ?? []).map((cat) => (
							<option key={cat._id} value={cat._id}>
								{cat.emoji ?? "🏷️"} {cat.name}
							</option>
						))}
					</Select>
					<Input
						type="number"
						placeholder="Min amt"
						value={amountMin}
						className="w-24"
						onChange={(e) => {
							setAmountMin(e.target.value);
							setPage(1);
						}}
					/>
					<Input
						type="number"
						placeholder="Max amt"
						value={amountMax}
						className="w-24"
						onChange={(e) => {
							setAmountMax(e.target.value);
							setPage(1);
						}}
					/>
				</div>
			</Card>

			<Card>
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead
									className="cursor-pointer select-none"
									onClick={() => handleSort("title")}
								>
									Title
									{renderSortIcon("title")}
								</TableHead>
								<TableHead>Category</TableHead>
								<TableHead
									className="cursor-pointer select-none"
									onClick={() => handleSort("amount")}
								>
									Amount
									{renderSortIcon("amount")}
								</TableHead>
								<TableHead
									className="cursor-pointer select-none"
									onClick={() => handleSort("dateTime")}
								>
									Date
									{renderSortIcon("dateTime")}
								</TableHead>
								<TableHead className="w-12">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={5}
										className="text-center text-[var(--color-muted)] py-8"
									>
										No expenses found
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
												<span className="text-xs">
													{cat?.emoji ?? "🏷️"} {cat?.name ?? "Unknown"}
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

				<div className="mt-3 flex items-center justify-between text-sm">
					<p className="text-[var(--color-muted)]">
						Page {page} of {totalPages}
					</p>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="icon"
							disabled={page <= 1}
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							aria-label="Previous page"
						>
							<FiChevronLeft className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							size="icon"
							disabled={page >= totalPages}
							onClick={() =>
								setPage((p) => Math.min(totalPages, p + 1))
							}
							aria-label="Next page"
						>
							<FiChevronRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</Card>
		</div>
	);
}
