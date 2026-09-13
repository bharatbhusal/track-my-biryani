"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog, Modal } from "@/components/modals/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useAppDispatch } from "@/store/hooks";
import { transitionBucketStatus } from "@/store/slices/bucketSlice";
import { bucketErrorMessage } from "../bucket-form";
import type { BucketLifecycleStatus, BucketSummary } from "@/constants/types/bucket.types";

const STATUS_META: Record<BucketLifecycleStatus, { label: string; description: string }> = {
  live: {
    label: "Active",
    description:
      "Everyone can add and edit expenses. When the expenses are final, start settlement to lock them.",
  },
  "settlement-config": {
    label: "Settlement setup",
    description:
      "Expenses are locked. Set each member's share percentage, then start collecting payments.",
  },
  "settlement-live": {
    label: "Collecting payments",
    description:
      "Payers can pay outside the app and receivers can confirm here. Close the bucket once everyone has settled.",
  },
  close: {
    label: "Closed",
    description: "Everything here is read-only.",
  },
};

export function StatusDialog({
  bucket,
  open,
  onClose,
}: {
  bucket: BucketSummary;
  open: boolean;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const [pendingTarget, setPendingTarget] = useState<
    "settlement-config" | "settlement-live" | "live" | null
  >(null);
  const [transitioning, setTransitioning] = useState(false);

  const status: BucketLifecycleStatus =
    bucket.lifecycleStatus ?? (bucket.closedAt ? "close" : "live");
  const meta = STATUS_META[status];
  const isOwner = bucket.role === "owner" && !bucket.isPersonal;

  const pickTarget = (target: "settlement-config" | "settlement-live" | "live") => {
    setPendingTarget(target);
  };

  const handleTransition = async () => {
    if (!pendingTarget) return;
    const target = pendingTarget;
    setPendingTarget(null);
    setTransitioning(true);
    try {
      if (target === "live") {
        await dispatch(transitionBucketStatus({ id: bucket._id, target })).unwrap();
        toast.success(`${bucket.name} is live again`);
      } else {
        await dispatch(transitionBucketStatus({ id: bucket._id, target })).unwrap();
        toast.success(
          target === "settlement-config" ? "Settlement started" : "Now collecting payments",
        );
      }
      onClose();
    } catch (err) {
      toast.error(bucketErrorMessage(err, "Failed to change bucket status"));
    } finally {
      setTransitioning(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Bucket status"
        subtitle={meta.label}
        description={meta.description}
        className="max-w-md"
      >
        {isOwner && status !== "close" && (
          <div className="space-y-2">
            {status === "live" && (
              <Button
                className="w-full"
                disabled={transitioning}
                onClick={() => pickTarget("settlement-config")}
              >
                Start settlement
              </Button>
            )}
            {status === "settlement-config" && (
              <>
                <Button
                  className="w-full"
                  disabled={transitioning}
                  onClick={() => pickTarget("settlement-live")}
                >
                  Start collecting payments
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={transitioning}
                  onClick={() => pickTarget("live")}
                >
                  Back to live editing
                </Button>
              </>
            )}
            {status === "settlement-live" && (
              <p className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-muted)]">
                Close the bucket once every member has settled up.
              </p>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={pendingTarget !== null}
        title={
          pendingTarget === "settlement-config"
            ? "Start settlement?"
            : pendingTarget === "settlement-live"
              ? "Start collecting payments?"
              : "Back to live?"
        }
        subtitle={
          pendingTarget === "settlement-config"
            ? "Locks expenses"
            : pendingTarget === "settlement-live"
              ? "Open payments"
              : "Unlock editing"
        }
        description={
          pendingTarget === "settlement-config"
            ? `Expenses and categories in "${bucket.name}" will become read-only. You'll set member shares next.`
            : pendingTarget === "settlement-live"
              ? `Members can now pay their shares (UPI) and confirm receipt in "${bucket.name}". Shares are locked.`
              : `"${bucket.name}" returns to a fully editable bucket. You'll need to start settlement again later.`
        }
        onConfirm={() => void handleTransition()}
        onCancel={() => setPendingTarget(null)}
      />
    </>
  );
}
