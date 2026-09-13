"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDialog } from "@/components/modals/dialog";
import { buildUpiUrl, getPlatformSpecificUrls } from "@/lib/upi";
import { isAndroid, isIOS } from "@/lib/devices";
import { formatCurrency } from "@/lib/format";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  confirmSettlement,
  fetchBucketBalances,
  fetchBucketSettlements,
} from "@/store/slices/bucketSlice";
import { bucketErrorMessage } from "../bucket-form";
import type { BucketDetail, DebtEdge } from "@/constants/types/bucket.types";

type SettleUpPanelProps = {
  bucket: BucketDetail;
};

export function SettleUpPanel({ bucket }: SettleUpPanelProps) {
  const dispatch = useAppDispatch();
  const currency = useAppSelector((s) => s.ui.currency);
  const myId = useAppSelector((s) => s.auth.user?.id);
  const balances = useAppSelector((s) => s.buckets.balances);

  const [loadedBucketId, setLoadedBucketId] = useState<string | null>(null);
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  const [pendingEdge, setPendingEdge] = useState<DebtEdge | null>(null);

  const isClosed = Boolean(bucket.closedAt);
  // loadedBucketId !== bucket._id doubles as the loading flag: until this
  // bucket's fetch resolves (or fails), the panel shows skeletons.
  const loading = loadedBucketId !== bucket._id;

  useEffect(() => {
    if (bucket.isPersonal) return;
    let cancelled = false;
    Promise.all([
      dispatch(fetchBucketBalances(bucket._id)).unwrap(),
      dispatch(fetchBucketSettlements(bucket._id)).unwrap(),
    ])
      .then(() => {
        if (!cancelled) setLoadedBucketId(bucket._id);
      })
      .catch(() => {
        // balances/settlements stay empty; sections degrade to their empty states
        if (!cancelled) setLoadedBucketId(bucket._id);
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch, bucket._id, bucket.isPersonal]);

  const mine = useMemo(
    () => balances?.members.find((m) => m.memberId === myId) ?? null,
    [balances, myId],
  );

  const youOwe = useMemo(
    () => (balances?.debts ?? []).filter((d) => d.fromUserId === myId),
    [balances, myId],
  );
  const owedToYou = useMemo(
    () => (balances?.debts ?? []).filter((d) => d.toUserId === myId),
    [balances, myId],
  );
  const others = useMemo(
    () => (balances?.debts ?? []).filter((d) => d.fromUserId !== myId && d.toUserId !== myId),
    [balances, myId],
  );
  const hasDebts = youOwe.length + owedToYou.length + others.length > 0;

  const handleConfirmReceived = async (edge: DebtEdge) => {
    setPendingFrom(edge.fromUserId);
    try {
      await dispatch(confirmSettlement({ id: bucket._id, fromUserId: edge.fromUserId })).unwrap();
      toast.success("Settlement confirmed");
    } catch (err) {
      toast.error(bucketErrorMessage(err, "Failed to confirm settlement"));
    } finally {
      setPendingFrom(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Card>
          <Skeleton className="mb-3 h-4 w-24" />
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </Card>
        <Card>
          <Skeleton className="mb-3 h-4 w-24" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="mt-2 h-10 w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {isClosed && (
        <Card className="flex items-center gap-3 border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10">
          <p className="text-sm font-semibold text-[var(--color-danger)]">This bucket is closed</p>
          <p className="text-xs text-[var(--color-muted)]">
            Closed {bucket.closedAt ? format(new Date(bucket.closedAt), "d MMM yyyy") : ""} —
            everything here is read-only.
          </p>
        </Card>
      )}

      <Card>
        <CardTitle className="mb-3">Your balance</CardTitle>
        {mine ? (
          <div className="grid grid-cols-3 gap-2">
            <BalanceStat label="Spent" value={formatCurrency(mine.paidAmount, currency)} />
            <BalanceStat label="Your share" value={formatCurrency(mine.owedAmount, currency)} />
            <BalanceStat
              label="Net"
              value={formatCurrency(mine.netBalance, currency)}
              valueClassName={
                mine.netBalance > 0.01
                  ? "text-[var(--color-success)]"
                  : mine.netBalance < -0.01
                    ? "text-[var(--color-danger)]"
                    : "text-[var(--color-muted)]"
              }
            />
          </div>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">No balance info yet.</p>
        )}
      </Card>

      <Card>
        <CardTitle className="mb-3">Settle up</CardTitle>
        {!hasDebts ? (
          <p className="text-sm text-[var(--color-muted)]">All settled up</p>
        ) : (
          <div className="space-y-3">
            {youOwe.map((edge) => (
              <YouOweRow
                key={edge.toUserId}
                edge={edge}
                bucketName={bucket.name}
                currency={currency}
                upiId={balances?.members.find((m) => m.memberId === edge.toUserId)?.upiId ?? ""}
                readOnly={isClosed}
              />
            ))}
            {owedToYou.map((edge) => (
              <div
                key={edge.fromUserId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2"
              >
                <p className="min-w-0 truncate text-sm">
                  <span className="text-[var(--color-muted)]">{edge.fromName}</span>{" "}
                  <span className="font-semibold tabular-nums">
                    {formatCurrency(edge.amount, currency)}
                  </span>
                </p>
                {!isClosed && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    disabled={pendingFrom === edge.fromUserId}
                    onClick={() => setPendingEdge(edge)}
                  >
                    {pendingFrom === edge.fromUserId ? (
                      <>
                        <Spinner className="mr-1.5" />
                        Confirming...
                      </>
                    ) : (
                      "Received?"
                    )}
                  </Button>
                )}
              </div>
            ))}
            {others.length > 0 && (
              <div className="space-y-1 border-t border-[var(--color-border)] pt-2">
                <p className="text-xs text-[var(--color-muted)]">Who pays whom</p>
                {others.map((edge) => (
                  <p
                    key={`${edge.fromUserId}-${edge.toUserId}`}
                    className="text-xs text-[var(--color-muted)]"
                  >
                    {edge.fromName} pays {edge.toName}{" "}
                    <span className="tabular-nums">{formatCurrency(edge.amount, currency)}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={pendingEdge !== null}
        title="Confirm payment"
        subtitle="Money received?"
        description={
          pendingEdge
            ? `New ${formatCurrency(pendingEdge.amount, currency)} from ${pendingEdge.fromName} will be marked settled.`
            : ""
        }
        onConfirm={() => {
          if (!pendingEdge) return;
          const edge = pendingEdge;
          setPendingEdge(null);
          void handleConfirmReceived(edge);
        }}
        onCancel={() => setPendingEdge(null)}
      />
    </div>
  );
}

function BalanceStat({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] px-3 py-2">
      <p className="text-xs text-[var(--color-muted)]">{label}</p>
      <p
        className={`text-sm font-semibold tabular-nums${valueClassName ? ` ${valueClassName}` : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function YouOweRow({
  edge,
  bucketName,
  currency,
  upiId,
  readOnly,
}: {
  edge: DebtEdge;
  bucketName: string;
  currency: string;
  upiId: string;
  readOnly: boolean;
}) {
  if (!upiId) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] px-3 py-2">
        <p className="text-sm">
          You owe <span className="font-medium">{edge.toName}</span>{" "}
          <span className="font-semibold tabular-nums">
            {formatCurrency(edge.amount, currency)}
          </span>
        </p>
        {!readOnly && (
          <p className="text-xs text-[var(--color-muted)]">Ask them to add their UPI id.</p>
        )}
      </div>
    );
  }

  const upiUrl = buildUpiUrl({
    pa: upiId,
    pn: edge.toName,
    am: edge.amount,
    tn: `Bucket "${bucketName}" settle-up`,
  });
  const { gpay, phonepe, paytm, generic } = getPlatformSpecificUrls(upiUrl);
  const apps = isIOS() || isAndroid() ? [gpay, phonepe, paytm, generic] : [generic];
  const labels = ["GPay", "PhonePe", "Paytm", "Any UPI app"];

  return (
    <div className="rounded-xl border border-[var(--color-border)] px-3 py-2">
      <p className="text-sm">
        You owe <span className="font-medium">{edge.toName}</span>{" "}
        <span className="font-semibold tabular-nums">{formatCurrency(edge.amount, currency)}</span>
      </p>
      {!readOnly && (
        <>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {apps.map((url, i) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                {labels[i]}
              </a>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-[var(--color-muted)]">
            Pay outside the app and ask them to confirm here.
          </p>
        </>
      )}
    </div>
  );
}
