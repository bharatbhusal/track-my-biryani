"use client";

import { FiChevronLeft, FiChevronRight, FiArrowUp, FiArrowDown } from "react-icons/fi";

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
import { formatDateTime } from "@/lib/datetime";
import { useAppSelector } from "@/store/hooks";
import { LogCard } from "@/features/logs/components/log-card";
import type { AuditLogItem } from "@/lib/api/audit";

export type SortField = "timestamp" | "action" | "entity";

type LogsTableProps = {
  items: AuditLogItem[];
  isLoading?: boolean;
  sortBy?: SortField;
  order?: "asc" | "desc";
  onSort?: (field: SortField) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
};

export function LogsTable({
  items,
  isLoading,
  sortBy,
  order,
  onSort,
  page,
  totalPages,
  onPageChange,
  emptyMessage = "No logs found",
}: LogsTableProps) {
  const locale = useAppSelector((s) => s.ui.locale);
  const timezone = useAppSelector((s) => s.ui.timezone);

  const renderSortIcon = (field: SortField) => {
    if (sortBy !== field || !order) return null;
    return order === "asc" ? (
      <FiArrowUp className="ml-1 inline h-3 w-3" />
    ) : (
      <FiArrowDown className="ml-1 inline h-3 w-3" />
    );
  };

  return (
    <>
      {/* Mobile: card layout */}
      <div className="space-y-2 md:hidden">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-2 rounded-md border border-[var(--color-border)] p-3">
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-5 w-16 self-center" />
            </div>
          ))
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--color-muted)]">{emptyMessage}</p>
        ) : (
          items.map((log) => <LogCard key={log._id} log={log} />)
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className={onSort ? "cursor-pointer select-none" : ""}
                onClick={() => onSort?.("action")}
              >
                Action
                {renderSortIcon("action")}
              </TableHead>
              <TableHead
                className={onSort ? "cursor-pointer select-none" : ""}
                onClick={() => onSort?.("entity")}
              >
                Entity
                {renderSortIcon("entity")}
              </TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Bucket</TableHead>
              <TableHead
                className={onSort ? "cursor-pointer select-none" : ""}
                onClick={() => onSort?.("timestamp")}
              >
                Time
                {renderSortIcon("timestamp")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-[var(--color-muted)]">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              items.map((log) => (
                <TableRow key={log._id}>
                  <TableCell className="font-medium capitalize">{log.action}</TableCell>
                  <TableCell className="capitalize text-[var(--color-muted)]">
                    {log.entity}
                  </TableCell>
                  <TableCell className="text-xs text-[var(--color-muted)]">
                    {log.actorUsername ? `@${log.actorUsername}` : (log.actorName ?? "—")}
                  </TableCell>
                  <TableCell className="text-xs text-[var(--color-muted)]">
                    {log.bucketName ? (
                      <>
                        {log.bucketIcon ?? "📁"} {log.bucketName}
                      </>
                    ) : (
                      "—"
                    )}
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

      {/* Pagination */}
      {page !== undefined && totalPages !== undefined && totalPages > 1 && onPageChange && (
        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page <= 1 ? totalPages : page - 1)}
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
            onClick={() => onPageChange(page >= totalPages ? 1 : page + 1)}
            aria-label="Next page"
          >
            <FiChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  );
}
