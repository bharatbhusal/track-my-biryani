"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/modals/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangeBar } from "@/components/charts/date-range-bar";

import { ExpenseTable } from "@/features/expenses/components/expense-table";
import { AddCategoryDialog } from "@/features/categories/components/add-category-dialog";
import { CategoryCard } from "@/features/categories/components/category-card";
import {
	useAppSelector,
	useAppDispatch,
} from "@/store/hooks";
import {
	fetchCategoryDetail,
	fetchCategoryStats,
	deleteCategory,
} from "@/store/slices/categorySlice";
import { fetchExpenses } from "@/store/slices/expenseSlice";
import { setDateRange } from "@/store/slices/uiSlice";
import { toIsoBounds } from "@/lib/date-range";
import type { ExpenseListQuery } from "@/types";
import { CashFlowChart } from "@/components/cash-flow-chart";
import { ChartSkeleton } from "@/components/charts/chart-skeleton";
import type { CategoryWithStats } from "@/types/analytics.types";

export function CategoryDetailView({ id }: { id: string }) {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [editDrawerOpen, setEditDrawerOpen] =
		useState(false);
	const [page, setPage] = useState(1);

	const dateRange = useAppSelector((s) => s.ui.dateRange);
	const activeBucketId = useAppSelector(
		(s) => s.ui.activeBucketId,
	);
	const currentUserId = useAppSelector(
		(s) => s.auth.user?.id,
	);

	const category = useAppSelector(
		(s) => s.categories.currentCategory,
	);
	const stats = useAppSelector((s) => s.categories.stats);
	const expenses = useAppSelector((s) => s.expenses.items);
	const expensesLoading = useAppSelector(
		(s) => s.expenses.loading,
	);
	const expensesTotalPages = useAppSelector(
		(s) => s.expenses.totalPages,
	);

	const isCreator =
		!!category &&
		!!currentUserId &&
		category.userId === currentUserId;

	const rangeBounds = useMemo(
		() => toIsoBounds(dateRange),
		[dateRange],
	);

	useEffect(() => {
		dispatch(
			fetchCategoryDetail({
				id,
				bucketId: activeBucketId ?? undefined,
			}),
		)
			.unwrap()
			.catch(() =>
				router.replace("/unauthorized?type=category"),
			);
	}, [dispatch, id, activeBucketId, router]);

	useEffect(() => {
		if (rangeBounds.from && rangeBounds.to) {
			dispatch(
				fetchCategoryStats({
					id,
					from: rangeBounds.from,
					to: rangeBounds.to,
					bucketId: activeBucketId ?? undefined,
				}),
			);
		}
	}, [
		dispatch,
		id,
		rangeBounds.from,
		rangeBounds.to,
		activeBucketId,
	]);

	useEffect(() => {
		const params: ExpenseListQuery = {
			page,
			limit: 20,
			categoryId: id,
			from: rangeBounds.from,
			to: rangeBounds.to,
			sortBy: "paidAt",
			order: "desc",
			bucketId: activeBucketId ?? undefined,
		};
		dispatch(fetchExpenses(params));
	}, [
		dispatch,
		id,
		page,
		rangeBounds.from,
		rangeBounds.to,
		activeBucketId,
	]);

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

	const categoryWithStats =
		useMemo((): CategoryWithStats | null => {
			if (!category || !stats) return null;
			return {
				...category,
				bucketId: category.bucketId,
				total: stats.total,
				count: stats.count,
				min: stats.min,
				max: stats.max,
				avg: stats.avg,
				pct: stats.pct,
			};
		}, [category, stats]);

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
					<ChartSkeleton />
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
			{categoryWithStats && (
				<CategoryCard
					category={categoryWithStats}
					onEdit={() => setEditDrawerOpen(true)}
					onDelete={() => setDeleteOpen(true)}
				/>
			)}
			<CashFlowChart
				title="Trend"
				stackedSeries={chartStackedSeries}
				categoryColorMap={chartColorMap}
				isLoading={expensesLoading}
			/>

			{expenses.length > 0 && (
				<ExpenseTable
					items={expenses}
					isLoading={expensesLoading}
					emptyMessage="No expenses in this category"
					page={page}
					totalPages={expensesTotalPages}
					onPageChange={setPage}
				/>
			)}

			<AddCategoryDialog
				open={editDrawerOpen}
				onClose={() => setEditDrawerOpen(false)}
				id={category?._id}
			/>

			<ConfirmDialog
				open={deleteOpen}
				title="Delete category"
				subtitle="Permanent action"
				description="This action cannot be undone."
				onCancel={() => setDeleteOpen(false)}
				onConfirm={async () => {
					try {
						await dispatch(
							deleteCategory({
								id,
								bucketId: category?.bucketId,
							}),
						).unwrap();
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
