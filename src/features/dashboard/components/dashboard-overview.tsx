"use client";

import { useMemo, useEffect } from "react";

import { FilterBar } from "@/components/filters";
import { ExpenseOverview } from "@/features/expenses/components/expense-overview";
import { DashboardBarChart } from "@/components/dashboard-bar-chart";
import { DistributionBar } from "@/components/charts/distribution-bar";
import { ExpenseTable } from "@/features/expenses/components/expense-table";
import type { SortField } from "@/features/expenses/components/expense-table";
import {
	useAppSelector,
	useAppDispatch,
} from "@/store/hooks";
import {
	fetchOverviewStats,
	fetchChartData,
	fetchExpenses,
} from "@/store/slices/expenseSlice";
import { fetchAllBuckets } from "@/store/slices/bucketSlice";
import {
	setSort,
	setPage,
} from "@/store/slices/expensesFilterSlice";
// import { expensesApi } from "@/lib/api/expenses";
// import type { DistributionPoint } from "@/types/analytics.types";
import { getChartLabel } from "@/lib/format";
import {
	presetLabel,
	toIsoBoundsForPreset,
} from "@/lib/date-range";
import {
	chartGranularity,
	filterBounds,
	// personalBucketId,
} from "@/lib/filters";

export function DashboardOverview() {
	const dispatch = useAppDispatch();

	const filterCriteria = useAppSelector(
		(s) => s.expensesFilter.filterCriteria,
	);
	const sortCriteria = useAppSelector(
		(s) => s.expensesFilter.sortCriteria,
	);
	const pagination = useAppSelector(
		(s) => s.expensesFilter.pagination,
	);

	const buckets = useAppSelector(
		(s) => s.buckets.allBuckets,
	);
	const categories = useAppSelector(
		(s) => s.categories.items,
	);
	const overviewStats = useAppSelector(
		(s) => s.expenses.overviewStats,
	);
	const chartData = useAppSelector(
		(s) => s.expenses.chartData,
	);
	const items = useAppSelector((s) => s.expenses.items);
	const totalPages = useAppSelector(
		(s) => s.expenses.totalPages,
	);
	const isLoading = useAppSelector(
		(s) => s.expenses.loading,
	);
	// const authUser = useAppSelector((s) => s.auth.user);

	// const [categoryDist, setCategoryDist] = useState<
	// 	DistributionPoint[]
	// >([]);
	// const [ownerDist, setOwnerDist] = useState<
	// 	DistributionPoint[]
	// >([]);
	// const [bucketDist, setBucketDist] = useState<
	// 	DistributionPoint[]
	// >([]);
	// const [distLoading, setDistLoading] = useState(false);

	const { from, to } = useMemo(
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

	useEffect(() => {
		dispatch(fetchAllBuckets());
	}, [dispatch]);

	useEffect(() => {
		dispatch(fetchOverviewStats({ from, to }));
	}, [dispatch, from, to]);

	// useEffect(() => {
	// 	let cancelled = false;
	// 	setDistLoading(true);
	// 	Promise.all([
	// 		expensesApi.getDistribution("category", filterCriteria),
	// 		expensesApi.getDistribution("owner", filterCriteria),
	// 		expensesApi.getDistribution("bucket", filterCriteria),
	// 	])
	// 		.then(([c, o, b]) => {
	// 			if (cancelled) return;
	// 			setCategoryDist(c);
	// 			setOwnerDist(o);
	// 			setBucketDist(b);
	// 			setDistLoading(false);
	// 		})
	// 		.catch(() => {
	// 			if (!cancelled) setDistLoading(false);
	// 		});
	// 	return () => {
	// 		cancelled = true;
	// 	};
	// }, [
	// 	filterCriteria.datePreset,
	// 	filterCriteria.customFrom,
	// 	filterCriteria.customTo,
	// ]);

	const categoryFilterIds = useMemo(
		() =>
			filterCriteria.categoryPreset === "MULTIPLE"
				? filterCriteria.categoryIds
				: [],
		[
			filterCriteria.categoryPreset,
			filterCriteria.categoryIds,
		],
	);

	useEffect(() => {
		dispatch(
			fetchChartData({
				from,
				to,
				categoryIds: categoryFilterIds,
			}),
		);
	}, [dispatch, from, to, categoryFilterIds]);

	useEffect(() => {
		dispatch(fetchExpenses());
	}, [dispatch, filterCriteria, sortCriteria, pagination]);

	const averageSpend = useMemo(
		() =>
			overviewStats?.find((card) => card.key !== "total_spend")
				?.value,
		[overviewStats],
	);

	// const selectedOwnerIds = useMemo(() => {
	// 	if (filterCriteria.ownerPreset === "MULTIPLE")
	// 		return filterCriteria.ownerIds;
	// 	if (filterCriteria.ownerPreset === "ME" && authUser)
	// 		return [authUser.id];
	// 	return [];
	// }, [
	// 	filterCriteria.ownerPreset,
	// 	filterCriteria.ownerIds,
	// 	authUser,
	// ]);

	// const selectedBucketIds = useMemo(() => {
	// 	if (filterCriteria.bucketPreset === "MULTIPLE")
	// 		return filterCriteria.bucketIds;
	// 	if (filterCriteria.bucketPreset === "PERSONAL")
	// 		return [personalBucketId(buckets)];
	// 	return [];
	// }, [
	// 	filterCriteria.bucketPreset,
	// 	filterCriteria.bucketIds,
	// 	buckets,
	// ]);

	const handleSort = (field: SortField) => {
		dispatch(
			setSort({
				field,
				direction:
					sortCriteria.field === field &&
					sortCriteria.direction === "DESC"
						? "ASC"
						: "DESC",
			}),
		);
	};

	return (
		<div className="space-y-2">
			<FilterBar
				variant="expenses"
				buckets={buckets}
				categories={categories}
				owners={[]}
			/>
			{/* <h3 className="truncate px-2 text-base font-semibold tracking-tight">
				{presetLabel(filterCriteria.datePreset)}
			</h3> */}
			<ExpenseOverview
				data={overviewStats}
				isLoading={isLoading}
			/>

			{/* {categoryDist.length > 1 && (
				<DistributionBar
					title="Category Distribution"
					data={categoryDist}
					selectedIds={categoryFilterIds}
					isLoading={distLoading}
				/>
			)} */}
			{/* {ownerDist.length > 1 && (
				<DistributionBar
					title="Owner Distribution"
					data={ownerDist}
					selectedIds={selectedOwnerIds}
					isLoading={distLoading}
				/>
			)}
			{bucketDist.length > 1 && (
				<DistributionBar
					title="Bucket Distribution"
					data={bucketDist}
					selectedIds={selectedBucketIds}
					isLoading={distLoading}
				/>
			)} */}

			<DashboardBarChart
				stackedSeries={chartData?.series ?? []}
				chartLabel={getChartLabel(
					chartGranularity(filterCriteria.datePreset),
					"Expense",
				)}
				averageSpend={averageSpend}
				categoryColorMap={chartData?.categoryColors ?? {}}
				isLoading={isLoading}
			/>

			<ExpenseTable
				items={items}
				isLoading={isLoading}
				sortBy={sortCriteria.field as SortField}
				order={
					sortCriteria.direction === "ASC" ? "asc" : "desc"
				}
				onSort={handleSort}
				page={pagination.page}
				totalPages={totalPages}
				onPageChange={(p) => dispatch(setPage(p))}
			/>
		</div>
	);
}
