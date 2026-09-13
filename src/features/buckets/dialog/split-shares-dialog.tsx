"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog, Modal } from "@/components/modals/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useAppDispatch } from "@/store/hooks";
import { fetchBucketBalances, setBucketShares } from "@/store/slices/bucketSlice";
import { bucketErrorMessage } from "../bucket-form";
import type { BucketDialogBucket, MemberBalance } from "@/constants/types/bucket.types";

const clampShare = (v: number) => Math.min(100, Math.max(0, Math.round(v * 10000) / 10000));

// Equal split as the seed: 100/n each, last member takes the rounding remainder.
function equalSharesFor(roster: MemberBalance[]): Record<string, number> {
  const n = roster.length;
  if (n === 0) return {};
  const base = 100 / n;
  const out: Record<string, number> = {};
  roster.forEach((m, i) => {
    out[m.memberId] = i === n - 1 ? Math.round((100 - base * (n - 1)) * 10000) / 10000 : base;
  });
  return out;
}

// Keep the total at exactly 100: the changed member keeps its value, the
// remainder is redistributed across the others proportional to their shares.
function rebalance(
  prev: Record<string, number>,
  changedId: string,
  value: number,
): Record<string, number> {
  const ids = Object.keys(prev);
  if (ids.length <= 1) return { ...prev, [changedId]: value };
  const others = ids.filter((k) => k !== changedId);
  const othersTotal = others.reduce((sum, k) => sum + (prev[k] || 0), 0);
  const remainder = 100 - value;
  const scale = othersTotal > 0 ? remainder / othersTotal : remainder / others.length;
  const out: Record<string, number> = { ...prev, [changedId]: value };
  let accounted = 0;
  others.forEach((k, i) => {
    const adj = i === others.length - 1 ? remainder - accounted : (prev[k] || 0) * scale;
    out[k] = Math.round(adj * 10000) / 10000;
    accounted += out[k];
  });
  return out;
}

export function SplitSharesDialog({
  bucket,
  open,
  onClose,
}: {
  bucket: BucketDialogBucket;
  open: boolean;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const isOwner = bucket.role === "owner";
  const isClosed = Boolean(bucket.closedAt);
  // Member roster comes from the balances fetch (a BucketSummary has no members).
  const [members, setMembers] = useState<MemberBalance[]>([]);

  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  // loadedFor !== bucket._id doubles as the loading flag: until the balances
  // fetch resolves (or fails) the inputs show skeletons.
  const loading = open && loadedFor !== bucket._id;
  const [shares, setShares] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    let stale = false;
    dispatch(fetchBucketBalances(bucket._id))
      .unwrap()
      .then((balancesResult) => {
        if (stale) return;
        setMembers(balancesResult.members);
        // seed from saved percentages; equal split before the owner sets any
        const seed = { ...equalSharesFor(balancesResult.members) };
        for (const m of balancesResult.members) seed[m.memberId] = m.percentage;
        setShares(seed);
        setLoadedFor(bucket._id);
      })
      .catch(() => {
        // balances stay empty; the inputs degrade to the empty state
        if (stale) return;
        setLoadedFor(bucket._id);
      });
    return () => {
      stale = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [open, bucket._id, dispatch]);

  const handleChange = (userId: string, raw: string) => {
    const value = clampShare(Number(raw) || 0);
    setShares((prev) => ({ ...prev, [userId]: value }));
    // debounce the auto-adjust so fast typing of one member doesn't jitter the others
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShares((prev) => rebalance(prev, userId, value));
    }, 300);
  };

  const sharesTotal = Object.values(shares).reduce((sum, pct) => sum + (pct || 0), 0);
  const sharesValid =
    Math.abs(sharesTotal - 100) < 0.001 && Object.values(shares).every((pct) => pct >= 0);

  const handleSaveShares = async () => {
    if (!sharesValid) return;
    setConfirmOpen(false);
    setSaving(true);
    try {
      await dispatch(setBucketShares({ id: bucket._id, shares })).unwrap();
      toast.success("Shares updated");
      onClose();
    } catch (err) {
      toast.error(bucketErrorMessage(err, "Failed to save shares"));
    } finally {
      setSaving(false);
    }
  };

  if (!isOwner) return null;

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Split shares"
        subtitle="Set how much each member owes of the total"
        description={`Editing the split for "${bucket.name}". Members' owed amounts are recalculated from these percentages.`}
      >
        {isClosed && (
          <p className="mb-3 rounded-xl border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-3 py-2 text-xs text-[var(--color-danger)]">
            This bucket is closed — shares are read-only.
          </p>
        )}
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.memberId} className="flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-sm" title={m.memberName}>
                  {m.memberName}
                </p>
                <div className="flex shrink-0 items-center gap-1">
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100}
                    step="0.01"
                    aria-label={`${m.memberName} share percentage`}
                    className="w-24 py-1.5 text-right text-sm tabular-nums"
                    value={shares[m.memberId] ?? ""}
                    disabled={isClosed}
                    onChange={(e) => handleChange(m.memberId, e.target.value)}
                  />
                  <span className="text-sm text-[var(--color-muted)]">%</span>
                </div>
              </div>
            ))}
          </div>
        )}
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
          <p className="text-xs text-[var(--color-muted)]">
            Others adjust automatically to keep 100%.
          </p>
        </div>
        <Button
          className="mt-3 w-full"
          disabled={!sharesValid || saving || isClosed}
          onClick={() => setConfirmOpen(true)}
        >
          {saving ? (
            <>
              <Spinner className="mr-2" />
              Saving...
            </>
          ) : (
            "Save shares"
          )}
        </Button>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Save shares?"
        subtitle="Recalculates balances"
        description={`Members' owed amounts will be recalculated for "${bucket.name}".`}
        onConfirm={() => void handleSaveShares()}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
