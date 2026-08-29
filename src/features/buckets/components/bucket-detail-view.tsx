"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	FilterBar,
	useScopedOptions,
	sortForVariant,
} from "@/components/filters";
import { CashFlowChart } from "@/components/cash-flow-chart";
import { ChartSkeleton } from "@/components/charts/chart-skeleton";
import { ExpenseTable } from "@/features/expenses/components/expense-table";
import { BucketCard } from "@/features/buckets/components/bucket-card";
import {
	useAppSelector,
	useAppDispatch,
} from "@/store/hooks";
import {
	fetchAllBuckets,
	fetchBucketDetail,
} from "@/store/slices/bucketSlice";
import { expensesApi } from "@/lib/api/expenses";
import type { ChartData } from "@/types/analytics.types";
import type { ExpenseItem } from "@/types/expense.types";
import type { BucketSummary } from "@/types/bucket.types";

export function BucketDetailView({ id }: { id: string }) {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const [page, setPage] = useState(1);

	const sortCriteria = useAppSelector(
		(s) => s.filters.sortCriteria,
	);
	const filterCriteria = useAppSelector(
		(s) => s.filters.filterCriteria,
	);
	const buckets = useAppSelector(
		(s) => s.buckets.allBuckets,
	);
	const currentBucket = useAppSelector(
		(s) => s.buckets.currentBucket,
	);

	// ponytail: owners come from bucket members through the shared hook, so the
	// user filter can list everyone in the selected buckets.
	const { categories, owners } = useScopedOptions(
		true,
		buckets,
		"MULTIPLE",
		[id],
	);

	const scopedCriteria = useMemo(
		() => ({
			...filterCriteria,
			bucketPreset: "MULTIPLE" as const,
			bucketIds: [id],
		}),
		[filterCriteria, id],
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

	const [chartData, setChartData] =
		useState<ChartData | null>(null);
	const [chartLoading, setChartLoading] = useState(true);

	const effectiveSort = useMemo(
		() => sortForVariant("expenses", sortCriteria),
		[sortCriteria],
	);

	useEffect(() => {
		dispatch(fetchAllBuckets());
	}, [dispatch]);

	useEffect(() => {
		dispatch(fetchBucketDetail(id))
			.unwrap()
			.catch(() =>
				router.replace("/unauthorized?type=bucket"),
			);
	}, [dispatch, id, router]);

	useEffect(() => {
		let cancelled = false;
		expensesApi
			.getChartData({
				filterCriteria: scopedCriteria,
			})
			.then((data) => {
				if (cancelled) return;
				setChartData(data);
				setChartLoading(false);
			})
			.catch(() => {
				if (!cancelled) setChartLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [scopedCriteria]);

	useEffect(() => {
		let cancelled = false;
		expensesApi
			.searchExpenses({
				filterCriteria: scopedCriteria,
				sortCriteria: effectiveSort,
				pagination: { page, pageSize: 20 },
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
	}, [scopedCriteria, page, effectiveSort]);

	const bucketSummary = useMemo((): BucketSummary | null => {
		if (!currentBucket) return null;
		return {
			_id: currentBucket._id,
			name: currentBucket.name,
			icon: currentBucket.icon,
			ownerId: currentBucket.ownerId,
			ownerName: currentBucket.ownerName,
			isPersonal: currentBucket.isPersonal,
			memberCount: currentBucket.memberCount,
			totalAmount: currentBucket.totalAmount,
			expenseCount: currentBucket.expenseCount,
			createdAt: currentBucket.createdAt,
			role: currentBucket.role ?? "member",
			status: currentBucket.status ?? "accepted",
		};
	}, [currentBucket]);

	const chartColorMap = useMemo(
		() =>
			new Map(Object.entries(chartData?.categoryColors ?? {})),
		[chartData],
	);

	if (!currentBucket) {
		return (
			<div className="space-y-4 overflow-x-hidden">
				<Skeleton className="h-10 w-52" />
				<Card>
					<div className="flex justify-between mb-4">
						<Skeleton className="h-6 w-48" />
						<div className="flex gap-2">
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
				buckets={buckets}
				categories={categories}
				owners={owners}
			/>
			{bucketSummary && (
				<BucketCard
					bucket={bucketSummary}
					onDelete={() => router.replace("/buckets")}
					onLeave={() => router.replace("/buckets")}
				/>
			)}
			<CashFlowChart
				title="Trend"
				stackedSeries={chartData?.series ?? []}
				categoryColorMap={chartColorMap}
				isLoading={chartLoading}
			/>

			{expenses.length > 0 && (
				<ExpenseTable
					items={expenses}
					isLoading={expensesLoading}
					emptyMessage="No expenses in this bucket"
					page={page}
					totalPages={expensesTotalPages}
					onPageChange={setPage}
					isSection={effectiveSort.field === "paidAt"}
				/>
			)}
		</div>
	);
}
