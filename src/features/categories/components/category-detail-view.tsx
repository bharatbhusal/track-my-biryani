"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
	FiEdit2,
	FiTrash2,
} from "react-icons/fi";
import { toast } from "sonner";
import {
	Area,
	AreaChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ConfirmDrawer } from "@/components/ui/drawer";
import { ChartCard } from "@/components/charts/chart-card";
import { ExpenseTable } from "@/features/expenses/components/expense-table";
import { AddCategoryDrawer } from "@/features/categories/components/add-category-drawer";
import {
	useCategoryDetailQuery,
	useExpenseMutations,
	useExpensesQuery,
} from "@/hooks/api/use-expenses-api";
import { toIsoBounds } from "@/lib/date-range";
import { formatCurrency } from "@/lib/format";
import { useUIStore } from "@/store/ui-store";
import { useDateRange } from "@/components/charts/date-range-context";
import type { ExpenseListQuery } from "@/types";
import type {
	ExpenseItem,
	CategoryItem,
} from "@/types/expense.types";
import { EmojiBadge } from "@/components/ui/emoji-badge";

export function CategoryDetailView({
	id,
	initialCategory,
	initialExpenses,
}: {
	id: string;
	initialCategory?: CategoryItem | null;
	initialExpenses?: ExpenseItem[];
}) {
	const router = useRouter();
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [editDrawerOpen, setEditDrawerOpen] = useState(false);
	const locale = useUIStore((state) => state.locale);
	const currency = useUIStore((state) => state.currency);

	const { range: localRange } = useDateRange();
	const rangeBounds = useMemo(
		() => toIsoBounds(localRange),
		[localRange],
	);

	const categoryQuery = useCategoryDetailQuery(
		id,
		initialCategory,
	);
	const { deleteCategory } = useExpenseMutations();

	const expensesQueryParams = useMemo(
		() =>
			({
				page: 1,
				limit: 50,
				categoryId: id,
				from: rangeBounds.from,
				to: rangeBounds.to,
				sortBy: "dateTime",
				order: "desc",
			}) as ExpenseListQuery,
		[id, rangeBounds.from, rangeBounds.to],
	);

	const expensesQuery = useExpensesQuery(
		expensesQueryParams,
	);

	const category = categoryQuery.data;

	const expenses = useMemo(
		() => expensesQuery.data?.items ?? initialExpenses ?? [],
		[expensesQuery.data?.items, initialExpenses],
	);

	const analytics = useMemo(() => {
		const total = expenses.reduce(
			(sum, item) => sum + item.amount,
			0,
		);
		const highest = expenses.reduce(
			(max, item) => Math.max(max, item.amount),
			0,
		);
		const average =
			expenses.length > 0 ? total / expenses.length : 0;

		const monthly = new Map<string, number>();
		expenses.forEach((item) => {
			const month = new Intl.DateTimeFormat("en-IN", {
				month: "short",
				year: "2-digit",
			}).format(new Date(item.dateTime));
			monthly.set(
				month,
				(monthly.get(month) ?? 0) + item.amount,
			);
		});

		return {
			total,
			highest,
			average,
			monthlyTrend: Array.from(monthly.entries()).map(
				([name, totalAmt]) => ({
					name,
					total: totalAmt,
				}),
			),
		};
	}, [expenses]);

	if (!category) {
		return <Card>Loading category...</Card>;
	}

	return (
		<div className="space-y-4">
			<Card>
				<div className="mb-2 flex items-center justify-between">
					<CardTitle>
						<div className="flex items-center gap-3">
							<EmojiBadge
								emoji={category.emoji}
								color={category.color}
							/>
							<p className="text-lg">{category.name}</p>
						</div>
					</CardTitle>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							className="h-9 w-9 p-0"
							aria-label="Edit category"
							onClick={() => setEditDrawerOpen(true)}
						>
							<FiEdit2 />
						</Button>
						<Button
							variant="destructive"
							className="h-9 w-9 p-0"
							aria-label="Delete category"
							onClick={() => setDeleteOpen(true)}
						>
							<FiTrash2 />
						</Button>
					</div>
				</div>
				<div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 md:grid-cols-4">
					<p>
						<span className="text-[var(--color-muted)]">
							Total:
						</span>{" "}
						{formatCurrency(analytics.total, currency, locale)}
					</p>
					<p>
						<span className="text-[var(--color-muted)]">
							Highest:
						</span>{" "}
						{formatCurrency(analytics.highest, currency, locale)}
					</p>
					<p>
						<span className="text-[var(--color-muted)]">
							Average:
						</span>{" "}
						{formatCurrency(analytics.average, currency, locale)}
					</p>
					<p>
						<span className="text-[var(--color-muted)]">
							Transactions:
						</span>{" "}
						{expenses.length}
					</p>
				</div>
			</Card>

			<ChartCard title="Monthly Trend">
				<div className="h-64">
					<ResponsiveContainer width="100%" height="100%">
						<AreaChart data={analytics.monthlyTrend}>
							<XAxis
								dataKey="name"
								tick={{ fill: "var(--color-muted)", fontSize: 12 }}
							/>
							<YAxis
								tick={{ fill: "var(--color-muted)", fontSize: 12 }}
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: "var(--color-surface)",
									border: "1px solid var(--color-border)",
									borderRadius: "0.5rem",
									fontSize: "0.875rem",
								}}
							/>
							<Area
								dataKey="total"
								stroke="var(--chart-1)"
								fill="color-mix(in srgb, var(--chart-1) 20%, transparent)"
							/>
						</AreaChart>
					</ResponsiveContainer>
				</div>
			</ChartCard>

			<Card>
				<CardTitle className="mb-2">
					Recent in Category
				</CardTitle>
				<ExpenseTable
					items={expenses.slice(0, 10)}
					categoryMap={new Map([[category._id, category]])}
					emptyMessage="No expenses in this category"
				/>
			</Card>

			<AddCategoryDrawer
				open={editDrawerOpen}
				onClose={() => setEditDrawerOpen(false)}
				category={category}
			/>

			<ConfirmDrawer
				open={deleteOpen}
				title="Delete category"
				description="This action cannot be undone."
				onCancel={() => setDeleteOpen(false)}
				onConfirm={() => {
					deleteCategory.mutate(id, {
						onSuccess: () => {
							toast.success("Category deleted");
							router.replace("/categories");
						},
						onError: (error) => {
							toast.error(
								error instanceof Error
									? error.message
									: "Failed to delete category",
							);
						},
					});
				}}
			/>
		</div>
	);
}
