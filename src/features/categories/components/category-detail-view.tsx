"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
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
import { ConfirmDialog } from "@/components/ui/dialog";
import { ExpenseCard } from "@/features/expenses/components/expense-card";
import {
	useCategoryDetailQuery,
	useExpenseMutations,
	useExpensesQuery,
} from "@/hooks/api/use-expenses-api";
import { toIsoBounds } from "@/lib/date-range";
import { formatCurrency } from "@/lib/format";
import { useUIStore } from "@/store/ui-store";
import { useDateRange } from "@/components/charts/date-range-context";
import { ExpenseListQuery } from "@/types";
import { themedTooltipProps } from "@/components/charts/chart-tooltip";

export function CategoryDetailView({ id }: { id: string }) {
	const router = useRouter();
	const [deleteOpen, setDeleteOpen] = useState(false);
	const locale = useUIStore((state) => state.locale);
	const currency = useUIStore((state) => state.currency);

	const { range: localRange } = useDateRange();
	const rangeBounds = useMemo(
		() => toIsoBounds(localRange),
		[localRange],
	);

	const categoryQuery = useCategoryDetailQuery(id);
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
		() => expensesQuery.data?.items ?? [],
		[expensesQuery.data?.items],
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
				([name, totalAmount]) => ({ name, total: totalAmount }),
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
						{category.emoji ?? "🏷️"} {category.name}
					</CardTitle>
					<div className="flex items-center gap-2">
						<Link href={`/categories/${id}/edit`}>
							<Button
								variant="outline"
								className="h-9 w-9 p-0"
								aria-label="Edit category"
							>
								<FiEdit2 />
							</Button>
						</Link>
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
				<div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
					<p>
						Total spending:{" "}
						{formatCurrency(analytics.total, currency, locale)}
					</p>
					<p>
						Highest expense:{" "}
						{formatCurrency(analytics.highest, currency, locale)}
					</p>
					<p>
						Average expense:{" "}
						{formatCurrency(analytics.average, currency, locale)}
					</p>
					<p>Transactions: {expenses.length}</p>
				</div>
			</Card>

			<Card>
				<CardTitle className="mb-2">Monthly Trend</CardTitle>
				<div className="h-64">
					<ResponsiveContainer width="100%" height="100%">
						<AreaChart data={analytics.monthlyTrend}>
							<XAxis dataKey="name" />
							<YAxis />
							<Tooltip {...themedTooltipProps} />
							<Area
								dataKey="total"
								stroke="#10b981"
								fill="#10b98122"
							/>
						</AreaChart>
					</ResponsiveContainer>
				</div>
			</Card>

			<Card>
				<CardTitle className="mb-2">
					Recent in Category
				</CardTitle>
				<ul className="space-y-2 text-sm">
					{expenses.slice(0, 10).map((item) => (
						<li key={item._id}>
							<ExpenseCard expense={item} category={category} />
						</li>
					))}
				</ul>
			</Card>

			<ConfirmDialog
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
