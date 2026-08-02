"use client";

import { useEffect, useState } from "react";

import { auditApi } from "@/lib/api/audit";
import type { AuditLogItem } from "@/lib/api/audit";
import { LogsTable } from "@/features/logs/components/logs-table";

export function LogsView() {
	const [items, setItems] = useState<AuditLogItem[]>([]);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		auditApi
			.listLogs({ page, limit: 30 })
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
	}, [page]);

	return (
		<div className="space-y-2">
			<h3 className="text-base font-semibold tracking-tight px-2">
				Activity Logs
			</h3>
			<LogsTable
				items={items}
				isLoading={isLoading}
				page={page}
				totalPages={totalPages}
				onPageChange={setPage}
			/>
		</div>
	);
}
