"use client";

import { useEffect, useState } from "react";

import { BucketSwitcher } from "@/components/layout/bucket-switcher";
import { LogsTable } from "@/features/logs/components/logs-table";
import type { SortField } from "@/features/logs/components/logs-table";
import { auditApi } from "@/lib/api/audit";
import type { AuditLogItem } from "@/lib/api/audit";
import { useAppSelector } from "@/store/hooks";

export default function LogsPage() {
	const activeBucketId = useAppSelector((s) => s.ui.activeBucketId);
	const [items, setItems] = useState<AuditLogItem[]>([]);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [sortBy, setSortBy] = useState<SortField>("timestamp");
	const [order, setOrder] = useState<"asc" | "desc">("desc");
	const [isLoading, setIsLoading] = useState(true);

	const [prevBucketId, setPrevBucketId] = useState(activeBucketId);
	if (prevBucketId !== activeBucketId) {
		setPrevBucketId(activeBucketId);
		setPage(1);
	}

	useEffect(() => {
		let cancelled = false;
		auditApi
			.listLogs({
				page,
				limit: 30,
				bucketId: activeBucketId ?? undefined,
				sortBy,
				order,
			})
			.then((res) => {
				if (cancelled) return;
				setItems(res.items);
				setTotalPages(res.totalPages);
			})
			.catch(() => {})
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [page, activeBucketId, sortBy, order]);

	const handleSort = (field: SortField) => {
		if (sortBy === field) {
			setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
		} else {
			setSortBy(field);
			setOrder("desc");
		}
		setPage(1);
	};

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between px-2">
				<h3 className="text-base font-semibold tracking-tight">
					Activity Logs
				</h3>
				<BucketSwitcher />
			</div>
			<LogsTable
				items={items}
				isLoading={isLoading}
				sortBy={sortBy}
				order={order}
				onSort={handleSort}
				page={page}
				totalPages={totalPages}
				onPageChange={setPage}
			/>
		</div>
	);
}
