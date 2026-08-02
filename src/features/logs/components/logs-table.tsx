"use client";

import {
	FiChevronLeft,
	FiChevronRight,
} from "react-icons/fi";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSelector } from "@/store/hooks";
import { formatDateTime } from "@/lib/datetime";
import type { AuditLogItem } from "@/lib/api/audit";

type LogsTableProps = {
	items: AuditLogItem[];
	isLoading?: boolean;
	page?: number;
	totalPages?: number;
	onPageChange?: (page: number) => void;
	emptyMessage?: string;
};

export function LogsTable({
	items,
	isLoading,
	page,
	totalPages,
	onPageChange,
	emptyMessage = "No logs found",
}: LogsTableProps) {
	const locale = useAppSelector((s) => s.ui.locale);
	const timezone = useAppSelector((s) => s.ui.timezone);

	return (
		<>
			<div className="overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Action</TableHead>
							<TableHead>Entity</TableHead>
							<TableHead className="w-40">Time</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							[...Array(5)].map((_, i) => (
								<TableRow key={i}>
									<TableCell>
										<Skeleton className="h-4 w-32" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-24" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-24" />
									</TableCell>
								</TableRow>
							))
						) : items.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={3}
									className="py-8 text-center text-[var(--color-muted)]"
								>
									{emptyMessage}
								</TableCell>
							</TableRow>
						) : (
							items.map((log) => (
								<TableRow key={log._id}>
									<TableCell className="font-medium capitalize">
										{log.action}
									</TableCell>
									<TableCell className="capitalize text-[var(--color-muted)]">
										{log.entityType}
									</TableCell>
									<TableCell className="text-xs whitespace-nowrap text-[var(--color-muted)]">
										{formatDateTime(log.timestamp, locale, timezone)}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{page !== undefined &&
				totalPages !== undefined &&
				totalPages > 1 &&
				onPageChange && (
					<div className="mt-3 flex items-center justify-center gap-3 text-sm">
						<Button
							variant="outline"
							size="icon"
							onClick={() =>
								onPageChange(page <= 1 ? totalPages : page - 1)
							}
							aria-label="Previous page"
						>
							<FiChevronLeft className="h-4 w-4" />
						</Button>
						<p className="text-[var(--color-muted)]">
							{page} / {totalPages}
						</p>
						<Button
							variant="outline"
							size="icon"
							onClick={() =>
								onPageChange(page >= totalPages ? 1 : page + 1)
							}
							aria-label="Next page"
						>
							<FiChevronRight className="h-4 w-4" />
						</Button>
					</div>
				)}
		</>
	);
}
