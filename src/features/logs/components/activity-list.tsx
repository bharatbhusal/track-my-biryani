"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { useActivityLogsQueryWithRange } from "@/hooks/api/use-analytics-api";
import { toRangeParams } from "@/lib/date-range";
import { formatDate } from "@/lib/format";
import { useUIStore } from "@/store/ui-store";

export function ActivityList() {
	const globalDateRange = useUIStore(
		(state) => state.globalDateRange,
	);
	const logsQuery = useActivityLogsQueryWithRange(
		1,
		25,
		toRangeParams(globalDateRange),
	);
	const locale = useUIStore((state) => state.locale);
	const timezone = useUIStore((state) => state.timezone);

	return (
		<Card data-animate="true">
			<CardTitle className="mb-3">Recent Activity</CardTitle>
			<ul className="space-y-2 text-sm">
				{(logsQuery.data ?? []).map((log) => (
					<li
						key={log._id}
						data-animate="true"
						className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
					>
						<p className="font-medium capitalize">{log.action}</p>
						<p className="text-xs text-zinc-500">
							{log.entityType} {log.entityId ?? ""} •{" "}
							{formatDate(log.timestamp, locale, timezone)}
						</p>
					</li>
				))}
			</ul>
		</Card>
	);
}
