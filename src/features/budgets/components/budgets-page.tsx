"use client";

import { useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { EmojiBadge } from "@/components/ui/emoji-badge";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchBudgets } from "@/store/slices/budgetSlice";
import { fetchAllBuckets } from "@/store/slices/bucketSlice";
import { BudgetCard } from "@/features/budgets/components/budget-card";
import { AddBudgetDialog } from "@/features/budgets/components/budget-form";

export function BudgetsPage() {
  const dispatch = useAppDispatch();
  const groups = useAppSelector((s) => s.budgets.groups);
  const loading = useAppSelector((s) => s.budgets.loading);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchAllBuckets());
    dispatch(fetchBudgets());
  }, [dispatch]);

  if (loading && groups.length === 0) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Budgets</h1>
        <Button size="sm" onClick={() => setOpen(true)}>
          <FiPlus className="mr-1.5" /> New Budget
        </Button>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          title="No budgets yet"
          description="Create one per bucket or category — weekly, monthly or yearly."
        />
      ) : (
        groups.map((group) => (
          <div key={group.bucketId} className="space-y-2">
            <div className="flex items-center gap-2">
              <EmojiBadge
                emoji={group.bucketIcon}
                color="var(--color-surface-muted)"
                className="h-6 w-6 text-xs"
              />
              <h2 className="truncate text-sm font-semibold" title={group.bucketName}>
                {group.bucketName}
              </h2>
              <span className="text-xs text-[var(--color-muted)]">
                {group.budgets.length} budget(s)
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {group.budgets.map((b) => (
                <BudgetCard key={b._id} budget={b} />
              ))}
            </div>
          </div>
        ))
      )}

      <AddBudgetDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
