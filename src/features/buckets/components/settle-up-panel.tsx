"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDialog } from "@/components/modals/dialog";
import { buildUpiUrl, getPlatformSpecificUrls } from "@/lib/upi";
import { isAndroid, isIOS } from "@/lib/devices";
import { formatCurrency } from "@/lib/format";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  closeBucket,
  confirmSettlement,
  fetchBucketBalances,
  fetchBucketSettlements,
  setBucketShares,
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
  const settlements = useAppSelector((s) => s.buckets.settlements);

  const [loadedBucketId, setLoadedBucketId] = useState<string | null>(null);
  const [shares, setShares] = useState<Record<string, number>>({});
  const [savingShares, setSavingShares] = useState(false);
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  const [closeOpen, setCloseOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const isClosed = Boolean(bucket.closedAt);
  const isOwner = bucket.role === "owner";
  const acceptedMembers = useMemo(
    () => bucket.members.filter((m) => m.status === "accepted"),
    [bucket.members],
  );
  // loadedBucketId !== bucket._id doubles as the loading flag: until this
  // bucket's fetch resolves (or fails), the panel shows skeletons.
  const loading = loadedBucketId !== bucket._id;

  const equalShares: Record<string, number> = useMemo(() => {
    const n = acceptedMembers.length;
    if (n === 0) return {};
    const base = 100 / n;
    const out: Record<string, number> = {};
    acceptedMembers.forEach((m, i) => {
      out[m.userId] = i === n - 1 ? Math.round((100 - base * (n - 1)) * 100) / 100 : base;
    });
    return out;
  }, [acceptedMembers]);

  useEffect(() => {
    if (bucket.isPersonal) return;
    let cancelled = false;
    Promise.all([
      dispatch(fetchBucketBalances(bucket._id)).unwrap(),
      dispatch(fetchBucketSettlements(bucket._id)).unwrap(),
    ])
      .then(([balancesResult]) => {
        if (cancelled) return;
        setLoadedBucketId(bucket._id);
        // seed shares from saved percentages; equal split before the owner sets any.
        const seed = { ...equalShares };
        for (const m of balancesResult.members) seed[m.memberId] = m.percentage;
        setShares(seed);
      })
      .catch(() => {
        // balances/settlements stay empty; sections degrade to their empty states
        if (!cancelled) setLoadedBucketId(bucket._id);
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch, bucket._id, bucket.isPersonal, equalShares]);

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

  const sortedSettlements = useMemo(
    () =>
      [...settlements].sort(
        (a, b) => new Date(b.confirmedAt).getTime() - new Date(a.confirmedAt).getTime(),
      ),
    [settlements],
  );

  const sharesTotal = Object.values(shares).reduce((sum, pct) => sum + (pct || 0), 0);
  const sharesValid = Math.abs(sharesTotal - 100) < 0.005;
  const isEqualSplit =
    acceptedMembers.length > 0 &&
    acceptedMembers.every((m) => shares[m.userId] === equalShares[m.userId]);

  const handleSaveShares = async () => {
    if (!sharesValid) return;
    const payload = { ...shares };
    // ponytail: nudge the last member so the backend's strict `=== 100` check passes despite float drift
    const ids = Object.keys(payload);
    if (ids.length > 0) {
      payload[ids[ids.length - 1]] =
        Math.round((100 - (sharesTotal - payload[ids[ids.length - 1]])) * 100) / 100;
    }
    setSavingShares(true);
    try {
      await dispatch(setBucketShares({ id: bucket._id, shares: payload })).unwrap();
      toast.success("Shares updated");
    } catch (err) {
      toast.error(bucketErrorMessage(err, "Failed to save shares"));
    } finally {
      setSavingShares(false);
    }
  };

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

  const handleClose = async () => {
    setClosing(true);
    try {
      await dispatch(closeBucket(bucket._id)).unwrap();
      toast.success("Bucket closed");
      setCloseOpen(false);
    } catch (err) {
      toast.error(bucketErrorMessage(err, "Failed to close bucket"));
    } finally {
      setClosing(false);
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
        <Card>
          <Skeleton className="mb-3 h-4 w-24" />
          <Skeleton className="h-10 w-full" />
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
          <>
            <div className="grid grid-cols-3 gap-2">
              <BalanceStat label="Spent" value={formatCurrency(mine.paidAmount, currency)} />
              <BalanceStat label="Your share" value={formatCurrency(mine.owedAmount, currency)} />
              <BalanceStat label="Net" value={formatCurrency(mine.netBalance, currency)} />
            </div>
            <p className="mt-2 text-sm font-medium tabular-nums">
              {mine.netBalance > 0.01 ? (
                <span className="text-[var(--color-success)]">
                  You are owed {formatCurrency(mine.netBalance, currency)}
                </span>
              ) : mine.netBalance < -0.01 ? (
                <span className="text-[var(--color-danger)]">
                  You owe {formatCurrency(Math.abs(mine.netBalance), currency)}
                </span>
              ) : (
                <span className="text-[var(--color-muted)]">All settled up</span>
              )}
            </p>
          </>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">No balance info yet.</p>
        )}
      </Card>

      {isOwner && !isClosed && (
        <Card>
          <CardTitle className="mb-1">Split shares</CardTitle>
          <p className="mb-3 text-xs text-[var(--color-muted)]">
            Set how much each member owes of the total.
          </p>
          <div className="space-y-2">
            {acceptedMembers.map((m) => (
              <div key={m.userId} className="flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-sm" title={m.name}>
                  {m.name}
                </p>
                <div className="flex shrink-0 items-center gap-1">
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100}
                    step="0.01"
                    aria-label={`${m.name} share percentage`}
                    className="w-24 py-1.5 text-right text-sm tabular-nums"
                    value={shares[m.userId] ?? ""}
                    onChange={(e) =>
                      setShares((prev) => ({ ...prev, [m.userId]: Number(e.target.value) }))
                    }
                  />
                  <span className="text-sm text-[var(--color-muted)]">%</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <p
              className={
                sharesValid
                  ? "text-xs text-[var(--color-muted)]"
                  : "text-xs text-[var(--color-danger)]"
              }
            >
              Total: {sharesTotal.toFixed(2)}%
            </p>
            {isEqualSplit && (
              <p className="text-xs text-[var(--color-muted)]">By default shares split equally.</p>
            )}
          </div>
          <Button
            className="mt-2 w-full"
            disabled={!sharesValid || savingShares}
            onClick={handleSaveShares}
          >
            {savingShares ? (
              <>
                <Spinner className="mr-2" />
                Saving...
              </>
            ) : (
              "Save shares"
            )}
          </Button>
        </Card>
      )}

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
                className="flex items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2"
              >
                <p className="min-w-0 truncate text-sm">
                  <span className="font-medium">{edge.fromName}</span>{" "}
                  <span className="text-[var(--color-muted)]">owes you</span>{" "}
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
                    onClick={() => void handleConfirmReceived(edge)}
                  >
                    {pendingFrom === edge.fromUserId ? (
                      <>
                        <Spinner className="mr-1.5" />
                        Confirming...
                      </>
                    ) : (
                      "Money received?"
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

      <Card>
        <CardTitle className="mb-3">Settlements</CardTitle>
        {sortedSettlements.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">No settlements yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {sortedSettlements.map((s) => (
              <li key={s._id} className="text-sm text-[var(--color-muted)]">
                <span className="font-medium text-[var(--color-text)]">
                  {s.fromName ?? "Someone"}
                </span>{" "}
                <span aria-hidden="true">→</span>{" "}
                <span className="font-medium text-[var(--color-text)]">
                  {s.toName ?? "Someone"}
                </span>{" "}
                <span className="font-semibold tabular-nums text-[var(--color-text)]">
                  {formatCurrency(s.amount, currency)}
                </span>{" "}
                · confirmed {format(new Date(s.confirmedAt), "d MMM yyyy")}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {isOwner && !isClosed && (
        <>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Close bucket</p>
              <p className="text-xs text-[var(--color-muted)]">
                {balances?.allMembersPaid
                  ? "Everyone has settled — lock this bucket."
                  : "Waiting for everyone to settle."}
              </p>
            </div>
            <Button
              variant="outline"
              className="shrink-0"
              disabled={!balances?.allMembersPaid || closing}
              onClick={() => setCloseOpen(true)}
            >
              Close bucket
            </Button>
          </div>
          <ConfirmDialog
            open={closeOpen}
            title="Close bucket"
            subtitle="Locks the bucket"
            description={`Everyone has settled. Close "${bucket.name}"? This locks the bucket — expenses and settlement edits will be disabled.`}
            onConfirm={() => void handleClose()}
            onCancel={() => setCloseOpen(false)}
          />
        </>
      )}
    </div>
  );
}

function BalanceStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] px-3 py-2">
      <p className="text-xs text-[var(--color-muted)]">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
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
