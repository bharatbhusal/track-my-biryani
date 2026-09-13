"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/modals/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { closeBucket, fetchBucketBalances } from "@/store/slices/bucketSlice";
import { bucketErrorMessage } from "../bucket-form";
import type { BucketDialogBucket } from "@/constants/types/bucket.types";

export function CloseBucketDialog({
  bucket,
  open,
  onClose,
  onClosed,
}: {
  bucket: BucketDialogBucket;
  open: boolean;
  onClose: () => void;
  onClosed?: () => void;
}) {
  const dispatch = useAppDispatch();
  const balances = useAppSelector((s) => s.buckets.balances);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!open) return;
    // balances stay empty on error; the confirm button stays disabled
    dispatch(fetchBucketBalances(bucket._id)).catch(() => {});
  }, [open, bucket._id, dispatch]);

  const waitingMembers = (balances?.members ?? []).filter((m) => Math.abs(m.netBalance) > 0.01);
  const canClose = Boolean(balances?.allMembersPaid);

  const handleClose = async () => {
    setClosing(true);
    try {
      await dispatch(closeBucket(bucket._id)).unwrap();
      toast.success("Bucket closed");
      onClose();
      onClosed?.();
    } catch (err) {
      toast.error(bucketErrorMessage(err, "Failed to close bucket"));
    } finally {
      setClosing(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Close bucket"
      subtitle={canClose ? "Locks the bucket" : "Waiting for everyone to settle"}
      description={
        canClose
          ? `Everyone has settled — lock this bucket. Close "${bucket.name}"? This locks the bucket — expenses and settlement edits will be disabled.`
          : `"${bucket.name}" can't be closed until every member settles up.`
      }
      className="max-w-md"
    >
      {!canClose && waitingMembers.length > 0 && (
        <ul className="mb-3 space-y-1 rounded-xl border border-[var(--color-border)] px-3 py-2">
          <p className="text-xs text-[var(--color-muted)]">Still waiting on:</p>
          {waitingMembers.map((m) => (
            <li key={m.memberId} className="text-sm text-[var(--color-text)]">
              {m.memberName}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose} autoFocus>
          Cancel
        </Button>
        <Button
          variant="destructive"
          disabled={!canClose || closing}
          onClick={() => void handleClose()}
        >
          {closing ? (
            <>
              <Spinner className="mr-1.5" />
              Closing...
            </>
          ) : (
            "Close bucket"
          )}
        </Button>
      </div>
    </Modal>
  );
}
