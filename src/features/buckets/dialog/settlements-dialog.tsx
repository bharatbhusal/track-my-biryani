"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";

import { Modal } from "@/components/modals/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchBucketSettlements } from "@/store/slices/bucketSlice";
import type { BucketDialogBucket } from "@/constants/types/bucket.types";

export function SettlementsDialog({
  bucket,
  open,
  onClose,
}: {
  bucket: BucketDialogBucket;
  open: boolean;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const currency = useAppSelector((s) => s.ui.currency);
  const settlements = useAppSelector((s) => s.buckets.settlements);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  // loadedFor !== bucket._id doubles as the loading flag: until the fetch
  // resolves (or fails) the list shows skeletons.
  const loading = open && loadedFor !== bucket._id;

  useEffect(() => {
    if (!open) return;
    let stale = false;
    dispatch(fetchBucketSettlements(bucket._id))
      .then(() => {
        if (!stale) setLoadedFor(bucket._id);
      })
      .catch(() => {
        // settlements stay empty; the list degrades to its empty state
        if (!stale) setLoadedFor(bucket._id);
      });
    return () => {
      stale = true;
    };
  }, [open, bucket._id, dispatch]);

  const sortedSettlements = useMemo(
    () =>
      [...settlements].sort(
        (a, b) => new Date(b.confirmedAt).getTime() - new Date(a.confirmedAt).getTime(),
      ),
    [settlements],
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Settlements"
      subtitle="Payments confirmed in this bucket"
      description={`Money that has changed hands in "${bucket.name}".`}
    >
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : sortedSettlements.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">No settlements yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {sortedSettlements.map((s) => (
            <li key={s._id} className="text-sm text-[var(--color-muted)]">
              <span className="font-medium text-[var(--color-text)]">
                {s.fromName ?? "Someone"}
              </span>{" "}
              <span aria-hidden="true">→</span>{" "}
              <span className="font-medium text-[var(--color-text)]">{s.toName ?? "Someone"}</span>{" "}
              <span className="font-semibold tabular-nums text-[var(--color-text)]">
                {formatCurrency(s.amount, currency)}
              </span>{" "}
              · confirmed {format(new Date(s.confirmedAt), "d MMM yyyy")}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
