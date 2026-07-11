"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ConfirmDrawer } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangeBar } from "@/components/charts/date-range-bar";

import { ExpenseTable } from "@/features/expenses/components/expense-table";
import { AddCategoryDrawer } from "@/features/categories/components/add-category-drawer";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
	fetchCategoryDetail,
	fetchCategoryStats,
	deleteCategory,
} from "@/store/slices/categorySlice";
import {
	fetchExpenses,
} from "@/store/slices/expenseSlice";
import { setDateRange } from "@/store/slices/uiSlice";
import { toIsoBounds } from "@/lib/date-range";
import { formatCurrency } from "@/lib/format";
import type { ExpenseListQuery } from "@/types";
import { EmojiBadge } from "@/components/ui/emoji-badge";
import { CashFlowChart } from "@/components/cash-flow-chart";

export function CategoryDetailView({ id }: { id: string }) {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [editDrawerOpen, setEditDrawerOpen] = useState(false);
	const [page, setPage] = useState(1);

	const currency = useAppSelector((s) => s.ui.currency);
	const dateRange = useAppSelector((s) => s.ui.dateRange);

	const category = useAppSelector((s) => s.categories.currentCategory);
	const stats = useAppSelector((s) => s.categories.stats);
	const expenses = useAppSelector((s) => s.expenses.items);
	const expensesLoading = useAppSelector((s) => s.expenses.loading);

	const rangeBounds = useMemo(
		() => toIsoBounds(dateRange),
		[dateRange],
	);

	useEffect(() => {
		dispatch(fetchCategoryDetail(id));
	}, [dispatch, id]);

	useEffect(() => {
		if (rangeBounds.from && rangeBounds.to) {
			dispatch(
				fetchCategoryStats({
					id,
					from: rangeBounds.from,
					to: rangeBounds.to,
				}),
			);
		}
	}, [dispatch, id, rangeBounds.from, rangeBounds.to]);

	useEffect(() => {
		const params: ExpenseListQuery = {
			page,
			limit: 20,
			categoryId: id,
			from: rangeBounds.from,
			to: rangeBounds.to,
			sortBy: "paidAt",
			order: "desc",
		};
		dispatch(fetchExpenses(params));
	}, [dispatch, id, page, rangeBounds.from, rangeBounds.to]);

	const chartTrend = useMemo(() => {
		const raw = stats?.trend ?? [];
		if (raw.length === 0) return [];

		const isDaily = raw[0].name.length === 10;

		return raw.map((point) => {
			const parts = point.name.split("-");
			const date = isDaily
				? new Date(+parts[0], +parts[1] - 1, +parts[2])
				: new Date(+parts[0], +parts[1] - 1);
			return {
				name: new Intl.DateTimeFormat("en-IN", {
					month: "short",
					...(isDaily
						? { day: "2-digit" }
						: { year: "2-digit" }),
				}).format(date),
				total: point.total,
			};
		});
	}, [stats?.trend]);

	const chartStackedSeries = useMemo(
		() =>
			chartTrend.map((point) => ({
				name: point.name,
				[category?.name ?? "Category"]: point.total,
			})),
		[chartTrend, category?.name],
	);

	const chartColorMap = useMemo(
		() =>
			new Map([
				[
					category?.name ?? "Category",
					category?.color ?? "var(--chart-2)",
				],
			]),
		[category?.name, category?.color],
	);

	const routeUrl = useMemo(() => {
		if (expenses.length < 1) return null;

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
		return (
			<div className="space-y-4">
				<Skeleton className="h-10 w-52" />
				<Card>
					<div className="flex justify-between mb-4">
						<Skeleton className="h-6 w-48" />
						<div className="flex gap-2">
							<Skeleton className="h-9 w-9 rounded" />
							<Skeleton className="h-9 w-9 rounded" />
						</div>
					</div>
					<div className="grid grid-cols-2 gap-2">
						{[...Array(4)].map((_, i) => (
							<div key={i}>
								<Skeleton className="h-4 w-16 mb-1" />
								<Skeleton className="h-5 w-24" />
							</div>
						))}
					</div>
				</Card>
				<Card>
					<Skeleton className="h-4 w-32 mb-3" />
					<Skeleton className="h-64 w-full" />
				</Card>
				<Card>
					<Skeleton className="h-4 w-32 mb-3" />
					<div className="space-y-2">
						{[...Array(3)].map((_, i) => (
							<Skeleton key={i} className="h-16 w-full" />
						))}
					</div>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<DateRangeBar
				title={category?.name ?? "Category"}
				range={dateRange}
				onRangeChange={(r) => {
					dispatch(setDateRange(r));
					setPage(1);
				}}
			/>
			<Card className="flex flex-col gap-2">
				<CardTitle className="flex justify-between">
					<div className="flex items-center gap-3">
						<EmojiBadge
							emoji={category.emoji}
							color={category.color}
						/>
						<p className="text-lg">{category.name}</p>
					</div>
					<div className="flex gap-2">
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
				</CardTitle>

				{expensesLoading ? (
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
								stats?.total ?? 0,
								currency,
							)}
						</p>
						<p>
							<span className="text-[var(--color-muted)]">
								Highest:
							</span>{" "}
							{formatCurrency(stats?.max ?? 0, currency)}
						</p>
						<p>
							<span className="text-[var(--color-muted)]">
								Average:
							</span>{" "}
							{formatCurrency(stats?.avg ?? 0, currency)}
						</p>
						<p>
							<span className="text-[var(--color-muted)]">
								Transactions:
							</span>{" "}
							{stats?.count ?? 0}
						</p>
					</div>
				)}
			</Card>

			<CashFlowChart
				title="Trend"
				stackedSeries={chartStackedSeries}
				categoryColorMap={chartColorMap}
				isLoading={expensesLoading}
			/>

			{expenses.length > 0 && (
				<>
					<ExpenseTable
						items={expenses.slice(0, 10)}
						emptyMessage="No expenses in this category"
						page={page}
						totalPages={Math.ceil(expenses.length / 20)}
						onPageChange={setPage}
					/>

					{routeUrl && (
						<Card>
							<CardTitle className="mb-2">Expense Route</CardTitle>

							<p className="mb-3 text-sm text-[var(--color-muted)]">
								Route connecting the first{" "}
								{Math.min(expenses.length, 5)} expenses in this
								category.
							</p>

							<Button
								onClick={() => {
									if (routeUrl) {
										window.open(routeUrl, "_blank");
									}
								}}
							>
								View Route in Google Maps
							</Button>
						</Card>
					)}
				</>
			)}

			<AddCategoryDrawer
				open={editDrawerOpen}
				onClose={() => setEditDrawerOpen(false)}
				category={category}
			/>

			<ConfirmDrawer
				open={deleteOpen}
				title="Delete category"
				description="This action cannot be undone."
				isPending={false}
				onCancel={() => setDeleteOpen(false)}
				onConfirm={async () => {
					try {
						await dispatch(deleteCategory(id)).unwrap();
						toast.success("Category deleted");
						router.replace("/categories");
					} catch (error) {
						toast.error(
							error instanceof Error
								? error.message
								: "Failed to delete category",
						);
					}
				}}
			/>
		</div>
	);
}
