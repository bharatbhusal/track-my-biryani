"use client";

import { useEffect, useState } from "react";
import { CaretDown, CaretRight } from "@phosphor-icons/react";

import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { BucketCard } from "@/features/buckets/components/bucket-card";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchBuckets } from "@/store/slices/bucketSlice";

// ponytail: the bucket list lives with the buckets feature; the settings
// buckets page composes it with invitations/requests sections.
export function BucketsList() {
  const dispatch = useAppDispatch();
  const { buckets, loading } = useAppSelector((s) => s.buckets);
  const sortCriteria = useAppSelector((s) => s.filters.buckets.sortCriteria);
  const filterCriteria = useAppSelector((s) => s.filters.buckets.filterCriteria);

  useEffect(() => {
    dispatch(fetchBuckets());
  }, [dispatch, sortCriteria, filterCriteria]);

  if (loading && buckets.length === 0) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (buckets.length === 0) {
    return (
      <EmptyState title="No buckets yet" description="Create one to start tracking expenses." />
    );
  }

  const active = buckets.filter((b) => !b.closedAt);
  const closed = buckets.filter((b) => b.closedAt);

  const [archivedOpen, setArchivedOpen] = useState(false);

  return (
    <div className="space-y-6">
      <section>
        {active.length > 0 && (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {active.map((bucket) => (
              <BucketCard key={bucket._id} bucket={bucket} />
            ))}
          </div>
        )}
      </section>
      {closed.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setArchivedOpen((v) => !v)}
            className="mb-2 flex items-center gap-1 text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-text)]"
            aria-expanded={archivedOpen}
          >
            {archivedOpen ? (
              <CaretDown className="h-4 w-4" />
            ) : (
              <CaretRight className="h-4 w-4" />
            )}
            Archived Buckets ({closed.length})
          </button>
          {archivedOpen && (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {closed.map((bucket) => (
                <BucketCard key={bucket._id} bucket={bucket} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
