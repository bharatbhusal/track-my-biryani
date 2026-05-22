"use client";

import { useMemo, useState } from "react";
import {
	flexRender,
	getCoreRowModel,
	useReactTable,
	type ColumnDef,
} from "@tanstack/react-table";
import { ArrowDownAZ, ArrowDownNarrowWide, ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
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
import type { ExpenseItem } from "@/types/expense.types";

export function LogsTable() {
	const [categoryId, setCategoryId] = useState("");
	const [page, setPage] = useState(1);
	const [sortBy, setSortBy] = useState<"amount" | "dateTime">("dateTime");
	const [order, setOrder] = useState<"asc" | "desc">("desc");
	const globalDateRange = useUIStore((state) => state.globalDateRange);
	const locale = useUIStore((state) => state.locale);
	const timezone = useUIStore((state) => state.timezone);
	const currency = useUIStore((state) => state.currency);

	const categoriesQuery = useCategoriesQuery();
	const bounds = useMemo(() => toIsoBounds(globalDateRange), [globalDateRange]);
	const expensesQuery = useExpensesQuery({
		page,
		limit: 12,
		categoryId: categoryId || undefined,
		sortBy,
		order,
		from: bounds.from,
		to: bounds.to,
	});

	const categoryMap = useMemo(
		() => new Map((categoriesQuery.data ?? []).map((cat) => [cat._id, cat.name])),
		[categoriesQuery.data],
	);
	const data = expensesQuery.data?.items ?? [];
	const totalPages = expensesQuery.data?.totalPages ?? 1;

	const applySort = (field: "amount" | "dateTime") => {
		setSortBy((previousField) => {
			setOrder((currentOrder) =>
				previousField === field && currentOrder === "desc" ? "asc" : "desc",
			);
			return field;
		});
		setPage(1);
	};

	const columns = useMemo<ColumnDef<ExpenseItem>[]>(
		() => [
			{
				accessorKey: "title",
				header: "Title",
			},
			{
				accessorKey: "categoryId",
				header: "Category",
				cell: ({ row }) => categoryMap.get(row.original.categoryId) ?? "Uncategorized",
			},
			{
				accessorKey: "amount",
				header: "Amount",
				cell: ({ row }) => formatCurrency(row.original.amount, currency, locale),
			},
			{
				accessorKey: "dateTime",
				header: "Date",
				cell: ({ row }) => formatDate(row.original.dateTime, locale, timezone),
			},
		],
		[categoryMap, currency, locale, timezone],
	);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<Card data-animate="true">
			<div className="mb-4 flex flex-wrap items-center justify-between gap-2">
				<CardTitle>Transaction Logs</CardTitle>
				<div className="flex flex-wrap items-center gap-2">
					<Select
						value={categoryId}
						className="w-44"
						onChange={(event) => {
							setCategoryId(event.target.value);
							setPage(1);
						}}
						aria-label="Filter logs by category"
					>
						<option value="">All categories</option>
						{(categoriesQuery.data ?? []).map((category) => (
							<option key={category._id} value={category._id}>
								{category.name}
							</option>
						))}
					</Select>
					<Button
						variant="outline"
						size="sm"
						type="button"
						onClick={() => applySort("amount")}
					>
						<ArrowDownNarrowWide className="mr-1 h-4 w-4" />
						Amount
					</Button>
					<Button
						variant="outline"
						size="sm"
						type="button"
						onClick={() => applySort("dateTime")}
					>
						<ArrowDownAZ className="mr-1 h-4 w-4" />
						Date
					</Button>
				</div>
			</div>
			<Table>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<TableHead key={header.id}>
									{header.isPlaceholder
										? null
										: flexRender(header.column.columnDef.header, header.getContext())}
								</TableHead>
							))}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{table.getRowModel().rows.length ? (
						table.getRowModel().rows.map((row) => (
							<TableRow key={row.id}>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell colSpan={4} className="h-24 text-center text-[var(--color-muted)]">
								No logs found for selected filters.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
			<div className="mt-3 flex items-center justify-between text-sm">
				<p className="text-[var(--color-muted)]">
					Page {page} of {totalPages}
				</p>
				<div className="flex items-center gap-2">
					<Button
						size="icon"
						variant="outline"
						disabled={page <= 1}
						onClick={() => setPage((current) => Math.max(1, current - 1))}
						aria-label="Previous page"
					>
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<Button
						size="icon"
						variant="outline"
						disabled={page >= totalPages}
						onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
						aria-label="Next page"
					>
						<ArrowRight className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</Card>
	);
}
