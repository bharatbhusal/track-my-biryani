"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiList, FiPlus, FiSearch } from "react-icons/fi";
import { useDebouncedValue } from "@/hooks/use-debounce";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	useCategoriesQuery,
	useExpensesQuery,
} from "@/hooks/api/use-expenses-api";
import { toIsoBounds } from "@/lib/date-range";
import { useDateRange } from "@/components/charts/date-range-context";
import { ExpenseTable } from "@/features/expenses/components/expense-table";
import type { SortField } from "@/features/expenses/components/expense-table";
import { CategoryDistributionBar } from "@/features/expenses/components/category-distribution-bar";

export function ExpenseManager() {
	const router = useRouter();
	const [query, setQuery] = useState("");
	const [categoryId, setCategoryId] = useState("");
	const [sortBy, setSortBy] =
		useState<SortField>("dateTime");
	const [order, setOrder] = useState<"asc" | "desc">("desc");
	const [page, setPage] = useState(1);
	const { range: localRange } = useDateRange();

	const categoriesQuery = useCategoriesQuery();
	const debouncedQuery = useDebouncedValue(query, 300);

	const filters = useMemo(() => {
		const bounds = toIsoBounds(localRange);
		return {
			page,
			limit: 10,
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

	const handleCategorySelect = (id: string | undefined) => {
		setCategoryId(id ?? "");
		setPage(1);
	};

	return (
		<div className="space-y-4">
			<Card>
				<div className="mb-3 flex items-center justify-between gap-2">
					<CardTitle>
						<FiList className="inline mr-1.5 h-4 w-4" />
						Expenses
					</CardTitle>
					<Button onClick={() => router.push("/expenses/new")}>
						<FiPlus className="mr-1.5 h-4 w-4" />
						Add Expense
					</Button>
				</div>

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
			</Card>

			<CategoryDistributionBar
				range={localRange}
				selectedCategoryId={categoryId}
				onCategorySelect={handleCategorySelect}
			/>

			<ExpenseTable
				items={items}
				categoryMap={categoryMap}
				sortBy={sortBy}
				order={order}
				onSort={handleSort}
				page={page}
				totalPages={totalPages}
				onPageChange={setPage}
			/>
		</div>
	);
}
