"use client";

import { useEffect, useState } from "react";

import { FilterBar, useScopedOptions } from "@/components/filters";
import { LogsTable } from "@/features/logs/components/logs-table";
import type { SortField } from "@/features/logs/components/logs-table";
import { auditApi } from "@/lib/api/audit";
import type { AuditLogItem } from "@/lib/api/audit";
import { fetchAllBuckets } from "@/store/slices/bucketSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setPage, setSort } from "@/store/slices/logsFilterSlice";

export default function LogsPage() {
	const dispatch = useAppDispatch();
	const [result, setResult] = useState<{
		key: string | null;
		items: AuditLogItem[];
		totalPages: number;
	}>({ key: null, items: [], totalPages: 0 });

	const { filterCriteria, sortCriteria, pagination } =
		useAppSelector((s) => s.logsFilter);
	const buckets = useAppSelector((s) => s.buckets.allBuckets);

	// ponytail: the dialog already resolves owners from bucket members through
	// this hook — reused rather than a second derivation, at the cost of the
	// category fetch it also does.
	const { owners } = useScopedOptions(
		true,
		buckets,
		filterCriteria.bucketPreset,
		filterCriteria.bucketIds,
	);

	useEffect(() => {
		dispatch(fetchAllBuckets());
	}, [dispatch]);

	const requestKey = JSON.stringify({
		filterCriteria,
		sortCriteria,
		pagination,
	});

	useEffect(() => {
		let cancelled = false;
		auditApi
			.searchLogs({ filterCriteria, sortCriteria, pagination })
			.then((res) => {
				if (cancelled) return;
				setResult({
					key: requestKey,
					items: res.items,
					totalPages: res.totalPages,
				});
			})
			.catch(() => {
				if (!cancelled)
					setResult({ key: requestKey, items: [], totalPages: 0 });
			});
		return () => {
			cancelled = true;
		};
	}, [requestKey, filterCriteria, sortCriteria, pagination]);

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
			<div className="flex items-center justify-between px-2">
				<h3 className="text-base font-semibold tracking-tight">
					Activity Logs
				</h3>
			</div>
			<FilterBar
				variant="logs"
				buckets={buckets}
				categories={[]}
				owners={owners}
			/>
			<LogsTable
				items={result.items}
				isLoading={result.key !== requestKey}
				sortBy={sortCriteria.field as SortField}
				order={sortCriteria.direction === "ASC" ? "asc" : "desc"}
				onSort={handleSort}
				page={pagination.page}
				totalPages={result.totalPages}
				onPageChange={(p) => dispatch(setPage(p))}
			/>
		</div>
	);
}
