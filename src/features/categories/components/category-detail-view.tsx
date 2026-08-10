"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/modals/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
	FilterBar,
	sortForVariant,
} from "@/components/filters";

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
import { toIsoBoundsForPreset } from "@/lib/date-range";
import { expensesApi } from "@/lib/api/expenses";
import {
	filterBounds,
	scopedExpenseRequest,
} from "@/lib/filters";
import { CashFlowChart } from "@/components/cash-flow-chart";
import { ChartSkeleton } from "@/components/charts/chart-skeleton";
import type { CategoryWithStats } from "@/types/analytics.types";
import type { ExpenseItem } from "@/types/expense.types";

export function CategoryDetailView({ id }: { id: string }) {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [editDrawerOpen, setEditDrawerOpen] =
		useState(false);
	const [page, setPage] = useState(1);

	const filterCriteria = useAppSelector(
		(s) => s.filters.filterCriteria,
	);
	const sortCriteria = useAppSelector(
		(s) => s.filters.sortCriteria,
	);

	const category = useAppSelector(
		(s) => s.categories.currentCategory,
	);
	const stats = useAppSelector((s) => s.categories.stats);
	// ponytail: memoized on the raw slice reference (stable across unrelated
	// renders) so the normalized sort is a stable dependency for the effect.
	const effectiveSort = useMemo(
		() => sortForVariant("expenses", sortCriteria),
		[sortCriteria],
	);
	const [expenseList, setExpenseList] = useState<{
		items: ExpenseItem[];
		totalPages: number;
		loading: boolean;
	}>({ items: [], totalPages: 0, loading: true });
	const {
		items: expenses,
		totalPages: expensesTotalPages,
		loading: expensesLoading,
	} = expenseList;

	// ponytail: the persisted filters slice drives the card, the chart and
	// the list — no local copy, so the selection survives navigation.
	const bounds = useMemo(
		() =>
			filterBounds(
				toIsoBoundsForPreset(
					filterCriteria.datePreset,
					filterCriteria.customFrom,
					filterCriteria.customTo,
				),
			),
		[
			filterCriteria.datePreset,
			filterCriteria.customFrom,
			filterCriteria.customTo,
		],
	);

	// ponytail: when the shared filter changes, drop back to page one — the
	// documented "adjust state while rendering" pattern (store the previous
	// value in state, compare during render), same as the filter dialog draft.
	const filterKey = JSON.stringify([
		filterCriteria,
		sortCriteria,
	]);
	const [prevFilterKey, setPrevFilterKey] =
		useState(filterKey);
	if (prevFilterKey !== filterKey) {
		setPrevFilterKey(filterKey);
		setPage(1);
	}

	useEffect(() => {
		dispatch(fetchCategoryDetail(id))
			.unwrap()
			.catch(() =>
				router.replace("/unauthorized?type=category"),
			);
	}, [dispatch, id, router]);

	useEffect(() => {
		dispatch(
			fetchCategoryStats({
				id,
				from: bounds.from,
				to: bounds.to,
			}),
		);
	}, [dispatch, id, bounds.from, bounds.to]);

	useEffect(() => {
		let cancelled = false;
		expensesApi
			.searchExpenses({
				...scopedExpenseRequest({
					bucketId: category?.bucketId,
					categoryId: id,
					page,
					from: bounds.from,
					to: bounds.to,
				}),
				sortCriteria: effectiveSort,
			})
			.then((res) => {
				if (cancelled) return;
				setExpenseList({
					items: res.items,
					totalPages: res.totalPages,
					loading: false,
				});
			})
			.catch(() => {
				if (!cancelled)
					setExpenseList({
						items: [],
						totalPages: 0,
						loading: false,
					});
			});
		return () => {
			cancelled = true;
		};
	}, [
		id,
		page,
		bounds.from,
		bounds.to,
		sortCriteria,
		effectiveSort,
		category?.bucketId,
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
		<div className="space-y-2">
			<FilterBar
				variant="expenses"
				buckets={[]}
				categories={[]}
				owners={[]}
				sections={{
					buckets: false,
					categories: false,
					owners: false,
					additional: false,
					search: false,
					sort: true,
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
					isSection={effectiveSort.field === "paidAt"}
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
