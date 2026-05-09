"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ExpenseCard } from "@/features/expenses/components/expense-card";
import {
	useCategoryDetailQuery,
	useExpensesQuery,
} from "@/hooks/api/use-expenses-api";
import { formatCurrency, formatDate } from "@/lib/format";
import { useUIStore } from "@/store/ui-store";

export function CategoryDetailView({ id }: { id: string }) {
	const locale = useUIStore((state) => state.locale);
	const currency = useUIStore((state) => state.currency);
	const timezone = useUIStore((state) => state.timezone);
	const categoryQuery = useCategoryDetailQuery(id);
	const expensesQuery = useExpensesQuery({
		page: 1,
		limit: 50,
		categoryId: id,
		sortBy: "dateTime",
		order: "desc",
	});

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
			const month = new Intl.DateTimeFormat("en-US", {
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
					<CardTitle>{category.name}</CardTitle>
					<Link href={`/categories/${id}/edit`}>
						<Button variant="outline">Edit</Button>
					</Link>
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
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="name" />
							<YAxis />
							<Tooltip />
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
							<ExpenseCard expense={item} />
						</li>
					))}
				</ul>
			</Card>
		</div>
	);
}
