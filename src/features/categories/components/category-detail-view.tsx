"use client";

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
import { ConfirmDrawer } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartCard } from "@/components/charts/chart-card";
import { DateRangeSelect } from "@/components/charts/date-range-select";
import { ExpenseTable } from "@/features/expenses/components/expense-table";
import { AddCategoryDrawer } from "@/features/categories/components/add-category-drawer";
import {
	useCategoryDetailQuery,
	useCategoryStatsQuery,
	useExpenseMutations,
	useExpensesQuery,
} from "@/hooks/api/use-expenses-api";
import { toIsoBounds } from "@/lib/date-range";
import { formatCurrency } from "@/lib/format";
import { useUIStore } from "@/store/ui-store";
import type { ExpenseListQuery } from "@/types";
import type {
	ExpenseItem,
	CategoryItem,
} from "@/types/expense.types";
import type { GlobalDateRange } from "@/lib/date-range";
import { DEFAULT_GLOBAL_RANGE } from "@/lib/date-range";
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
	const [editDrawerOpen, setEditDrawerOpen] =
		useState(false);
	const [page, setPage] = useState(1);
	const [range, setRange] = useState<GlobalDateRange>(
		DEFAULT_GLOBAL_RANGE,
	);
	const locale = useUIStore((state) => state.locale);
	const currency = useUIStore((state) => state.currency);

	const rangeBounds = useMemo(
		() => toIsoBounds(range),
		[range],
	);

	const categoryQuery = useCategoryDetailQuery(
		id,
		initialCategory,
	);
	const statsQuery = useCategoryStatsQuery(
		id,
		rangeBounds.from,
		rangeBounds.to,
	);
	const { deleteCategory } = useExpenseMutations();

	const expensesQueryParams = useMemo(
		() =>
			({
				page,
				limit: 20,
				categoryId: id,
				from: rangeBounds.from,
				to: rangeBounds.to,
				sortBy: "dateTime",
				order: "desc",
			}) as ExpenseListQuery,
		[id, page, rangeBounds.from, rangeBounds.to],
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
			monthlyTrend: Array.from(monthly.entries()).map(
				([name, totalAmt]) => ({
					name,
					total: totalAmt,
				}),
			),
		};
	}, [expenses]);

	const routeUrl = useMemo(() => {
		if (expenses.length < 2) return null;

		const points = expenses
			.slice(0, 5)
			.filter(
				(item) =>
					item.location?.latitude && item.location?.longitude,
			);

		if (points.length < 2) return null;

		const origin = `${points[0].location.latitude},${points[0].location.longitude}`;
		const destination = `${points[points.length - 1].location.latitude},${points[points.length - 1].location.longitude}`;

		const waypoints = points
			.slice(1, -1)
			.map(
				(item) =>
					`${item.location.latitude},${item.location.longitude}`,
			)
			.join("|");

		return (
			`https://www.google.com/maps/dir/?api=1` +
			`&origin=${origin}` +
			`&destination=${destination}` +
			(waypoints
				? `&waypoints=${encodeURIComponent(waypoints)}`
				: "") +
			`&travelmode=driving`
		);
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
			</Card>

			<Card>
				<div className="flex items-center justify-between gap-2 flex-wrap mb-3">
					<CardTitle>Overview</CardTitle>
					<DateRangeSelect
						value={range}
						onChange={(r) => {
							setRange(r);
							setPage(1);
						}}
					/>
				</div>
				{statsQuery.isLoading ? (
					<div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 md:grid-cols-4">
						{[...Array(4)].map((_, i) => (
							<div key={i}>
								<Skeleton className="h-4 w-16 mb-1" />
								<Skeleton className="h-5 w-24" />
							</div>
						))}
					</div>
				) : (
					<div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 md:grid-cols-4">
						<p>
							<span className="text-[var(--color-muted)]">
								Total:
							</span>{" "}
							{formatCurrency(
								statsQuery.data?.total ?? 0,
								currency,
								locale,
							)}
						</p>
						<p>
							<span className="text-[var(--color-muted)]">
								Highest:
							</span>{" "}
							{formatCurrency(
								statsQuery.data?.max ?? 0,
								currency,
								locale,
							)}
						</p>
						<p>
							<span className="text-[var(--color-muted)]">
								Average:
							</span>{" "}
							{formatCurrency(
								statsQuery.data?.avg ?? 0,
								currency,
								locale,
							)}
						</p>
						<p>
							<span className="text-[var(--color-muted)]">
								Transactions:
							</span>{" "}
							{statsQuery.data?.count ?? 0}
						</p>
					</div>
				)}
			</Card>

			<ChartCard
				title="Monthly Trend"
				range={range}
				onRangeChange={(r) => {
					setRange(r);
					setPage(1);
				}}
			>
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
					page={page}
					totalPages={expensesQuery.data?.totalPages}
					onPageChange={setPage}
				/>
			</Card>
			<Card>
				<CardTitle className="mb-2">Expense Route</CardTitle>

				<p className="mb-3 text-sm text-[var(--color-muted)]">
					Route connecting the first{" "}
					{Math.min(expenses.length, 5)} expenses in this
					category.
				</p>

				<Button
					disabled={!routeUrl}
					onClick={() => {
						if (routeUrl) {
							window.open(routeUrl, "_blank");
						}
					}}
				>
					View Route in Google Maps
				</Button>
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
